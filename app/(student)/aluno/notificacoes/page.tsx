import { getStudentNotifications } from "@/modules/students/notifications";
import { NotificationsClient } from "./notifications-client";

export default async function StudentNotificationsPage() {
  const notifications = await getStudentNotifications();

  return <NotificationsClient initialNotifications={notifications} />;
}
