import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./admin";

/** Runs every day at 07:00 in the church's local time zone and greets members whose birthday is today. */
export const sendBirthdayGreetings = onSchedule(
  { schedule: "0 7 * * *", timeZone: "Africa/Cairo" },
  async () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const usersSnap = await db.collection("users").get();

    const birthdayUsers = usersSnap.docs.filter((doc) => {
      const dob = doc.data().dateOfBirth as Timestamp | undefined;
      if (!dob) return false;
      const d = dob.toDate();
      return d.getMonth() + 1 === month && d.getDate() === day;
    });

    await Promise.all(
      birthdayUsers.map((doc) =>
        db.collection("notifications").add({
          title: "Happy Birthday! 🎉",
          body: `Wishing ${doc.data().fullName} a blessed birthday from St. Paul the Apostle Family!`,
          type: "birthday",
          target: { scope: "member", memberId: doc.id },
          sentByFunction: true,
          sentAt: FieldValue.serverTimestamp(),
          data: { screen: "profile", id: doc.id },
        })
      )
    );
  }
);
