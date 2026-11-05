import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { supabase } from "../../lib/supabase";
import LoadingScreen from "./components/Loading";

type Destination = "/(auth)" | "/(home)";

export default function Index() {
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !sessionData.session) {
          if (mounted) setDestination("/(auth)");
          return;
        }

        const userId = sessionData.session.user.id;

        // Check the user's role in the profiles table.
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_role")
          .eq("id", userId)
          .single();

        if (profileError || !profile || profile.user_role !== "enforcer") {
          console.log("[CPAT] Unauthorized account. Access denied.");

          await supabase.auth.signOut();

          if (mounted) setDestination("/(auth)");
          return;
        }

        if (mounted) {
          setDestination("/(home)");
        }
      } catch (error) {
        console.error("[CPAT] Session verification failed:", error);

        await supabase.auth.signOut();

        if (mounted) {
          setDestination("/(auth)");
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (!destination) {
    return <LoadingScreen />;
  }

  return <Redirect href={destination} />;
}