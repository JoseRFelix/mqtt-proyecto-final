import React from "react";
import TrafficLight from "react-trafficlight";
import mqtt from "mqtt";

import "./App.css";

function getClient() {
  return mqtt.connect("ws://r124c4c7.en.emqx.cloud:8083/mqtt", {
    username: "traffic-light",
    password: "test",
    clientId: "traffic-light",
  });
}

const TIME_TO_RED = 3; // time to change from yellow to red
const DELAY_BEFORE_START = 5; // time before traffic light starts the process of changing

function App() {
  const [state, setState] = React.useState({
    RedOn: false,
    YellowOn: false,
    GreenOn: true,
  });
  const [counter, setCounter] = React.useState(null);
  const [timeToYellow, setTimeToYellow] = React.useState(null);
  const [timeToRed, setTimeToRed] = React.useState(null);
  const client = React.useRef(null);
  const duration = React.useRef(null);

  React.useEffect(() => {
    client.current = getClient();
    client.current.on("connect", () => {
      client.current.subscribe("put:traffic");
    });

    client.current.on("message", (topic, message) => {
      console.log(`Received message from topic: ${topic}`);

      const parsedMessage = JSON.parse(message.toString());

      if (parsedMessage && parsedMessage.duration) {
        if (timeToYellow !== null && timeToRed === null) {
          return setTimeToYellow((timeToYellow) => timeToYellow - 5);
        }

        if (counter === null) {
          duration.current = parsedMessage.duration;
          changeToRed({ delay: DELAY_BEFORE_START });
        }
      }
    });

    return () => client.current.end();
  }, [setTimeToYellow, timeToYellow, timeToRed, counter]);

  // TO YELLOW
  React.useEffect(() => {
    let intervalId;
    if (timeToYellow > 0) {
      intervalId = setTimeout(() => setTimeToYellow(timeToYellow - 1), 1000);
    }

    if (timeToYellow <= 0 && timeToYellow !== null) {
      setState((state) => ({ ...state, GreenOn: false, YellowOn: true }));
      setTimeToYellow(null);
      setTimeToRed(TIME_TO_RED);
    }

    return () => clearInterval(intervalId);
  }, [timeToYellow]);

  // TO RED
  React.useEffect(() => {
    let intervalId;
    if (timeToRed > 0) {
      intervalId = setTimeout(() => setTimeToRed(timeToRed - 1), 1000);
    }

    if (timeToRed <= 0 && timeToRed !== null) {
      setState((state) => ({ ...state, YellowOn: false, RedOn: true }));

      if (counter === null) {
        setCounter(duration.current);

        console.log("sending message to topic: start:counter");
        const payload = {
          duration: duration.current,
        };
        client.current.publish("start:counter", JSON.stringify(payload));
      }

      setTimeToRed(null);
    }

    return () => clearInterval(intervalId);
  }, [counter, setTimeToRed, timeToRed]);

  // TO GREEN
  React.useEffect(() => {
    let intervalId;
    if (counter > 0) {
      intervalId = setTimeout(() => setCounter(counter - 1), 1000);

      console.log("sending message to topic: patch:counter");
      const payload = {
        duration: counter,
      };

      client.current.publish("patch:counter", JSON.stringify(payload));
    }

    if (counter <= 0 && counter !== null) {
      setState((state) => ({ ...state, RedOn: false, GreenOn: true }));
      setCounter(null);

      console.log("sending message to topic: stop:traffic");
      const payload = {
        msg: "traffic light is green now",
      };
      client.current.publish("stop:traffic", JSON.stringify(payload));
    }

    return () => clearInterval(intervalId);
  }, [counter]);

  const changeToRed = ({ delay }) => {
    setTimeToYellow(delay);
  };

  return (
    <div className="app">
      {timeToYellow && (
        <h1 style={{ marginBottom: 12 }}>
          El semáforo cambiará en: {timeToYellow}
        </h1>
      )}

      <TrafficLight {...state} />
    </div>
  );
}

export default App;
