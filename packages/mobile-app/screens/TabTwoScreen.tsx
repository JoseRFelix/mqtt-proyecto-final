import * as React from "react";
import { StyleSheet } from "react-native";

import { Text, View } from "../components/Themed";
import { useUuid } from "../navigation";

import mqtt from "@taoqf/react-native-mqtt";

export function getClient() {
  return mqtt.connect("ws://r124c4c7.en.emqx.cloud:8083/mqtt", {
    username: "analytics",
    password: "test",
    clientId: "analytics",
  });
}

export default function TabTwoScreen() {
  const [uniqueUsers, setUniqueUsers] = React.useState(0);
  const client = React.useRef<any>();
  const uuid = useUuid();

  React.useEffect(() => {
    client.current = getClient();

    client.current.on("connect", () => {
      client.current.subscribe("get:analytics");
    });

    client.current.on(
      "message",
      (topic: string, message: { uniqueUsersAmount?: any }) => {
        console.log(`Received message from topic: ${topic}`);

        const parsedMessage = JSON.parse(message.toString());

        if (parsedMessage.uniqueUsersAmount) {
          setUniqueUsers(parsedMessage.uniqueUsersAmount);
        }
      }
    );

    return () => client.current.end();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conteo de usuarios únicos</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Text style={styles.uuid}>Su UUID es {uuid}</Text>
      <Text style={styles.title}>Usuarios únicos: {uniqueUsers}</Text>
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
  uuid: {
    marginBottom: 12,
  },
});
