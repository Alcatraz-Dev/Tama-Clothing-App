import Constants from "expo-constants";

export const isDevClient =
  Constants.executionEnvironment === "storeClient"
    ? false
    : true;