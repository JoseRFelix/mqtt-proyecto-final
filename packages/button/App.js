import * as React from "react";
import { View, StyleSheet, Text, Button } from "react-native";
import Constants from "expo-constants";
import mqtt from "@taoqf/react-native-mqtt";

function getClient() {
  return mqtt.connect("ws://r124c4c7.en.emqx.cloud:8083/mqtt", {
    username: "button",
    password: "test",
    clientId: "button",
  });
}

export default function App() {
  const [duration, setDuration] = React.useState(null);
  const [sent, setSent] = React.useState(false);
  const client = React.useRef(null);

  React.useEffect(() => {
    client.current = getClient();
    client.current.on("connect", () => {
      client.current.subscribe("patch:counter");
    });

    client.current.on("message", (topic, message) => {
      console.log(`Received message from topic: ${topic}`);
      setSent(false);
    });

    return () => client.current.end();
  }, [setDuration, duration]);

  const stopTraffic = () => {
    console.log("sending message to topic: put:traffic");
    const payload = {
      duration: 60,
    };
    client.current.publish("put:traffic", JSON.stringify(payload), () => {
      setSent(true);
    });
  };

  return (
    <View style={styles.container}>
      {sent ? (
        <Text style={styles.text}>
          El semáforo estará cambiando a rojo prontamente
        </Text>
      ) : null}
      <Button title="Parar tráfico" onPress={stopTraffic} />
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
  text: {
    marginBottom: 16,
  },
});
