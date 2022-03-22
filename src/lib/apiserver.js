// https://stackoverflow.com/questions/39019094/reactjs-get-json-object-data-from-an-url

export const apiLogMessage = (message) => {
  console.log(`*** MBS: apiLogMessage: ${message}`);
  return fetch(`http://127.0.0.1:5000/log?message=${encodeURIComponent(message)}`)
    .then((response) => response.text())
    .then((body) => {
      console.debug(body);
    })
    .catch((error) => {
      console.error(error);
    });
};

export const apiAskAI = (query, uid, pid, onChat) => {
  return fetch(
    `http://127.0.0.1:5000/ask?uid=${uid}&pid=${pid}&query=${query}&timestamp=${Date.now()}&url=${
      window.location.href
    }`
  )
    .then((response) => response.text())
    .then((body) => {
      console.log(`*** MBS: ${body}`);
      onChat('AI', uid + '.AI', body);
    })
    .catch((error) => {
      console.log(error);
      console.error(error);
    });
};
