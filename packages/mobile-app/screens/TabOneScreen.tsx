import * as React from "react";
import { StyleSheet, Vibration, Button } from "react-native";

import { Text, View } from "../components/Themed";
import Counter from "../components/Counter";
import { useUuid } from "../navigation";
import mqtt from "@taoqf/react-native-mqtt";

export function getClient() {
  return mqtt.connect("ws://r124c4c7.en.emqx.cloud:8083/mqtt", {
    username: "mobile-app",
    password: "test",
    clientId: "mobile-app",
  });
}

export default function TabOneScreen() {
  const [loading, setLoading] = React.useState(false);
  const uuid = useUuid();

  const [duration, setDuration] = React.useState<number | null>(null);
  const client = React.useRef<any>();

  React.useEffect(() => {
    client.current = getClient();

    client.current.on("connect", () => {
      client.current.subscribe("start:counter");
      client.current.subscribe("patch:counter");
      client.current.subscribe("stop:traffic");
    });

    client.current.on("message", (topic: string, message: string) => {
      console.log(`Received message from topic: ${topic}`);
      setLoading(false);

      const parsedMessage = JSON.parse(message.toString());
      if (topic === "stop:traffic") {
        return setDuration(null);
      }

      if (parsedMessage && parsedMessage.duration) {
        setDuration(parsedMessage.duration);
      }
    });

    return () => client.current.end();
  }, [setDuration, duration]);

  React.useEffect(() => {
    if (duration) Vibration.vibrate();
  }, [duration]);

  const stopTraffic = () => {
    const GEOLOCATION = [54.980206086231, 82.898068332003];
    setLoading(true);
    console.log("sending message to topic: put:traffic");
    const payload = {
      duration: 60,
      userId: uuid,
      location: GEOLOCATION,
    };
    client.current.publish("put:traffic", JSON.stringify(payload));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Semáforo</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      {duration && duration > 0 ? (
        <View>
          <Text style={styles.timerText}>Cruce!</Text>
          <Counter duration={duration} />
        </View>
      ) : loading ? (
        <Text>El semáfaro cambiará a rojo prontamente!</Text>
      ) : (
        <Button title="Parar semáforo" onPress={stopTraffic} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  timerText: {
    marginBottom: 18,
    textAlign: "center",
    fontSize: 20,
  },
});
