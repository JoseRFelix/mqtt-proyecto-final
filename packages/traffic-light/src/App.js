import React from "react";
import TrafficLight from "react-trafficlight";
import mqtt from "mqtt";

import "./App.css";

const client = mqtt.connect("ws://r124c4c7.en.emqx.cloud:8083/mqtt", {
  username: "test",
  password: "test",
});

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

  React.useEffect(() => {
    client.on("connect", () => {
      client.subscribe("put:traffic", (err) => {});
    });

    client.on("message", (topic, message) => {
      console.log(topic, message.toString());

      if (timeToYellow !== null) {
        return setTimeToYellow((timeToYellow) => timeToYellow - 1);
      }
      console.log("hello");
      changeToRed(DELAY_TO_RED);

      client.end();
    });
  }, [timeToYellow]);

  // TO YELLOW
  React.useEffect(() => {
    let intervalId;
    if (timeToYellow > 0) {
      intervalId = setTimeout(() => setTimeToYellow(timeToYellow - 1), 1000);
    }

    if (timeToYellow <= 0) {
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

    if (timeToRed <= 0) {
      setState((state) => ({ ...state, YellowOn: false, RedOn: true }));

      if (counter === null) {
        setCounter(COUNTER_TIME);
        client.publish("start:counter", COUNTER_TIME.toString());
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

    if (counter <= 0) {
      setState((state) => ({ ...state, RedOn: false, GreenOn: true }));
      setCounter(null);
    }

    return () => clearInterval(intervalId);
  }, [counter]);

  const changeToRed = (delay) => {
    setTimeToYellow(delay);
  };

  const changeToGreen = () => {
    // TODO: dynamic value
    setState((state) => ({ ...state, GreenOn: true, RedOn: false }));
  };

  return (
    <div className="app">
      <TrafficLight {...state} />
    </div>
  );
}

export default App;
