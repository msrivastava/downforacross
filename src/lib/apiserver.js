// https://stackoverflow.com/questions/39019094/reactjs-get-json-object-data-from-an-url
export const apiLogMessage = (message) => {
  return fetch('http://127.0.0.1:5000/log?message=' + message)
    .then((response) => response.text())
    .then((body) => {
      console.debug(body);
    })
    .catch((error) => {
      console.error(error);
    });
};

// https://stackoverflow.com/questions/39019094/reactjs-get-json-object-data-from-an-url
export const apiAskAI = (message, id, onChat) => {
  return fetch('http://127.0.0.1:5000/ask?query=' + message)
    .then((response) => response.text())
    .then((body) => {
      console.log(body);
      onChat('AI Assistant', id, body);
    })
    .catch((error) => {
      console.log(error);
      console.error(error);
    });
};
