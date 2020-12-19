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

const TIME_TO_RED = 3;
const DELAY_TO_RED = 5;
const COUNTER_TIME = 5;

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

  React.useEffect(() => {
    client.current = getClient();
    client.current.on("connect", () => {
      client.current.subscribe("put:traffic", (err) => {});
    });

    client.current.on("message", (topic, message) => {
      console.log(`Received message from topic: ${topic}`);

      if (timeToYellow !== null) {
        return setTimeToYellow((timeToYellow) => timeToYellow - 1);
      }

      changeToRed(DELAY_TO_RED);
    });

    return () => client.current.end();
  }, [setTimeToYellow, timeToYellow]);

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
        setCounter(COUNTER_TIME);

        console.log("sending message to topic: start:counter");
        const payload = {
          duration: COUNTER_TIME,
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
    }

    if (counter <= 0 && counter !== null) {
      setState((state) => ({ ...state, RedOn: false, GreenOn: true }));
      setCounter(null);
    }

    return () => clearInterval(intervalId);
  }, [counter]);

  const changeToRed = (delay) => {
    setTimeToYellow(delay);
  };

  return (
    <div className="app">
      <TrafficLight {...state} />
    </div>
  );
}

export default App;
