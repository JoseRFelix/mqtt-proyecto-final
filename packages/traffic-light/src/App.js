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

function getDistanceFromLatLonInKm({ lat1, lon1, lat2, lon2 }) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const TIME_TO_RED = 3; // time to change from yellow to red
const DELAY_BEFORE_START = 30; // time before traffic light starts the process of changing
const GEOLOCATION = [54.980206086231, 82.898068362003];

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
  const users = React.useRef(new Map());

  React.useEffect(() => {
    client.current = getClient();
    client.current.on("connect", () => {
      client.current.subscribe("put:traffic");
    });

    client.current.on("message", (topic, message) => {
      console.log(`Received message from topic: ${topic}`);

      const parsedMessage = JSON.parse(message.toString());

      if (
        parsedMessage &&
        parsedMessage.duration &&
        parsedMessage.userId &&
        parsedMessage.location
      ) {
        console.log(
          getDistanceFromLatLonInKm({
            lat1: parsedMessage.location[0],
            lon1: parsedMessage.location[1],
            lat2: GEOLOCATION[0],
            lon2: GEOLOCATION[1],
          })
        );
        if (
          getDistanceFromLatLonInKm({
            lat1: parsedMessage.location[0],
            lon1: parsedMessage.location[1],
            lat2: GEOLOCATION[0],
            lon2: GEOLOCATION[1],
          }) > 10
        ) {
        }
        if (timeToYellow !== null && timeToRed === null) {
          return setTimeToYellow((timeToYellow) => timeToYellow - 5);
        }

        if (counter === null && duration.current === null) {
          users.current.set(parsedMessage.userId, true);
          duration.current = parsedMessage.duration;
          return changeToRed({ delay: DELAY_BEFORE_START });
        }
      }
    });

    return () => client.current.end();
  }, [setTimeToYellow, timeToYellow, timeToRed, counter]);

  // Send analytics
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      console.log(users);
      console.log("sending message to topic: get:analytics");
      const payload = {
        uniqueUsersAmount: users.current.size,
      };
      console.log(payload);
      client.current.publish("get:analytics", JSON.stringify(payload));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

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

    return () => clearTimeout(intervalId);
  }, [timeToYellow]);

  // TO RED
  React.useEffect(() => {
    let intervalId;
    if (timeToRed > 0) {
      intervalId = setTimeout(() => setTimeToRed(timeToRed - 1), 1000);
    }

    if (timeToRed <= 0 && timeToRed !== null && counter === null) {
      console.log("sending message to topic: start:counter");
      const payload = {
        duration: duration.current,
      };
      client.current.publish("start:counter", JSON.stringify(payload), () => {
        setState((state) => ({ ...state, YellowOn: false, RedOn: true }));
        setCounter(duration.current);
        setTimeToRed(null);
      });
    }

    return () => clearTimeout(intervalId);
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
      console.log("sending message to topic: stop:traffic");
      const payload = {
        msg: "traffic light is green now",
      };
      client.current.publish("stop:traffic", JSON.stringify(payload), () => {
        setState((state) => ({ ...state, RedOn: false, GreenOn: true }));
        setCounter(null);
        duration.current = null;
      });
    }

    return () => clearTimeout(intervalId);
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
