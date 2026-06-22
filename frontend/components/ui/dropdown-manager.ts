type Subscriber = (openId: string | null) => void;

let currentOpen: string | null = null;
const subscribers = new Set<Subscriber>();

export function getOpenDropdown() {
  return currentOpen;
}

export function setOpenDropdown(id: string | null) {
  // debug log: track dropdown open changes
  // eslint-disable-next-line no-console
  console.log("[dropdown-manager] setOpenDropdown ->", id);
  currentOpen = id;
  subscribers.forEach((s) => s(currentOpen));
}

export function subscribeDropdown(cb: Subscriber) {
  subscribers.add(cb);
  // immediately notify
  // debug log subscription
  // eslint-disable-next-line no-console
  console.log("[dropdown-manager] subscribe -> currentOpen=", currentOpen);
  cb(currentOpen);
  return () => subscribers.delete(cb);
}

export default {
  getOpenDropdown,
  setOpenDropdown,
  subscribeDropdown,
};
