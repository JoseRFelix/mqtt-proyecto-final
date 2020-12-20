import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as React from "react";
import { ColorSchemeName } from "react-native";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

import NotFoundScreen from "../screens/NotFoundScreen";
import { RootStackParamList } from "../types";
import BottomTabNavigator from "./BottomTabNavigator";
import LinkingConfiguration from "./LinkingConfiguration";

const UuidContext = React.createContext("");

export function useUuid() {
  const context = React.useContext(UuidContext);
  return context;
}

// If you are not familiar with React Navigation, we recommend going through the
// "Fundamentals" guide: https://reactnavigation.org/docs/getting-started
export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

// A root stack navigator is often used for displaying modals on top of all other content
// Read more here: https://reactnavigation.org/docs/modal
const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { getItem, setItem } = useAsyncStorage("@deviceId");
  const [uuid, setUuid] = React.useState("");

  React.useEffect(() => {
    async function checkUuid() {
      const deviceId = await getItem();

      if (deviceId) {
        return setUuid(deviceId);
      }

      const generatedUuid = uuidv4();

      setUuid(generatedUuid);

      return setItem(generatedUuid);
    }

    checkUuid();
  }, []);

  return (
    <UuidContext.Provider value={uuid}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Root" component={BottomTabNavigator} />
        <Stack.Screen
          name="NotFound"
          component={NotFoundScreen}
          options={{ title: "Oops!" }}
        />
      </Stack.Navigator>
    </UuidContext.Provider>
  );
}
