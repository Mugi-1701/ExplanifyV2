function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object"
  ) {
    const data = error.response.data as Record<string, unknown>;

    if (typeof data.message === "string") {
      return data.message;
    }

    if (typeof data.error === "string") {
      return data.error;
    }

    if (data.details && typeof data.details === "object" && "issues" in data.details) {
      const issues = (data.details as { issues?: Array<{ message?: string }> }).issues;
      const firstIssue = issues?.find((issue) => typeof issue.message === "string");

      if (firstIssue?.message) {
        return firstIssue.message;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export { getApiErrorMessage };
