import * as React from "react";
import { View, StyleSheet, Text, Button } from "react-native";
import Constants from "expo-constants";
import mqtt from "@taoqf/react-native-mqtt";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

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

  const { getItem, setItem } = useAsyncStorage("@deviceId");
  const uuid = React.useRef("");

  React.useEffect(() => {
    async function setUuid() {
      const deviceId = await getItem();

      if (deviceId) {
        return;
      }

      const generatedUuid = uuidv4();
      uuid.current = generatedUuid;

      return setItem(generatedUuid);
    }

    setUuid();
  }, []);

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
    const GEOLOCATION = [54.980206086231, 82.898068362303];
    const payload = {
      duration: 60,
      userId: uuid,
      location: GEOLOCATION,
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
