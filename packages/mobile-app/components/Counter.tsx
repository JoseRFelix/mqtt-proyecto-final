//@ts-nocheck
import * as React from "react";
import { StyleSheet, Animated } from "react-native";
import Constants from "expo-constants";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { getClient } from "../utils";
import { MqttClient } from "mqtt";
import { Text, View } from "../components/Themed";

export default function Counter({ duration }) {
  if (!duration) {
    return null;
  }

  return (
    <View style={styles.container}>
      <CountdownCircleTimer
        isPlaying
        duration={duration}
        colors="#1922fd"
        onComplete={() => {
          return [true, 0];
        }}
      >
        {({ animatedColor }) => (
          <Animated.Text
            style={{ ...styles.remainingTime, color: animatedColor }}
          >
            {duration}
          </Animated.Text>
        )}
      </CountdownCircleTimer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  remainingTime: {
    fontSize: 46,
  },
});
