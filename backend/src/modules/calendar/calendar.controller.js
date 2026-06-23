const { createEvent, listEvents, getEvent, updateEvent, removeEvent } = require("./calendar.service");

async function create(req, res, next) {
  try {
    // Debug trace to confirm the server receives UTC timestamps.
    // eslint-disable-next-line no-console
    console.log("[calendar.controller] create body", req.body);
    const event = await createEvent({
      userId: req.auth.userId,
      data: req.body,
    });
    return res.status(201).json({ data: event });
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const events = await listEvents({
      userId: req.auth.userId,
      startTime: req.query.startTime,
      endTime: req.query.endTime,
    });
    return res.status(200).json({ data: events });
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const event = await getEvent({
      eventId: req.params.id,
      userId: req.auth.userId,
    });
    return res.status(200).json({ data: event });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    // Debug trace to confirm the server receives UTC timestamps.
    // eslint-disable-next-line no-console
    console.log("[calendar.controller] update body", { id: req.params.id, body: req.body });
    const event = await updateEvent({
      eventId: req.params.id,
      userId: req.auth.userId,
      data: req.body,
    });
    return res.status(200).json({ data: event });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await removeEvent({
      eventId: req.params.id,
      userId: req.auth.userId,
    });
    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
};
