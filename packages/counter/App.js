import * as React from "react";
import { View, StyleSheet, Animated, Text } from "react-native";
import Constants from "expo-constants";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import mqtt from "@taoqf/react-native-mqtt";
import * as Speech from "expo-speech";

function getClient() {
  return mqtt.connect("ws://r124c4c7.en.emqx.cloud:8083/mqtt", {
    username: "counter",
    password: "test",
    clientId: "counter",
  });
}

export default function App() {
  const [duration, setDuration] = React.useState(null);
  const client = React.useRef(null);

  React.useEffect(() => {
    client.current = getClient();
    client.current.on("connect", () => {
      client.current.subscribe("start:counter", (err) => {
        console.log(err);
      });
    });

    client.current.on("message", (topic, message) => {
      console.log(`Received message from topic: ${topic}`);
      const parsedMessage = JSON.parse(message.toString());

      if (parsedMessage && parsedMessage.duration) {
        setDuration(parsedMessage.duration);
      }
    });

    return () => client.current.end();
  }, [setDuration, duration]);

  React.useEffect(() => {
    let intervalId;
    if (duration > 0) {
      intervalId = setTimeout(() => setDuration(duration - 1), 1000);
    }

    if (duration <= 0 && duration !== null) {
      setDuration(null);
    }

    return () => clearInterval(intervalId);
  }, [setDuration, duration]);

  React.useEffect(() => {
    if (duration <= 10 && duration !== null) {
      Speech.speak(duration.toString());
    }
  });

  if (!duration) {
    return (
      <View style={styles.container}>
        <Text>Waiting for Traffic Light...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CountdownCircleTimer
        isPlaying
        duration={duration}
        colors="#004777"
        onComplete={() => {
          setDuration(null);
          return [true, 0];
        }}
      >
        {({ remainingTime, animatedColor }) => (
          <Animated.Text
            style={{ ...styles.remainingTime, color: animatedColor }}
          >
            {remainingTime}
          </Animated.Text>
        )}
      </CountdownCircleTimer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#ecf0f1",
    padding: 8,
  },
  remainingTime: {
    fontSize: 46,
  },
});
