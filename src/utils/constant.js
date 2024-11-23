const serverResponses = {
  400: {
    type: "Bad Request",
    description:
      "The request was malformed or invalid, possibly due to missing or incorrectly formatted parameters.",
  },
  401: {
    type: "Unauthorized",
    description:
      "The request lacked valid authentication credentials or the provided credentials were incorrect.",
  },
  403: {
    type: "Forbidden",
    description:
      "The request was valid, but you do not have permission to access the requested resource.",
  },
  404: {
    type: "Not Found",
    description:
      "The requested resource could not be found, possibly due to an incorrect URL or the resource no longer exists.",
  },
  405: {
    type: "Method Not Allowed",
    description:
      "The HTTP method used in the request is not supported for the requested resource.",
  },
  500: {
    type: "Internal Server Error",
    description:
      "The server encountered an unexpected condition and was unable to process the request.",
  },
  504: {
    type: "Gateway Timeout",
    description:
      "The server did not receive a timely response from an upstream server needed to complete the request.",
  },
};

module.exports=serverResponses;