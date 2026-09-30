import { prisma } from "@/lib/prisma";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title.trim(),
        message: params.message.trim(),
        link: params.link?.trim() || null,
      },
    });
  } catch (error) {
    console.error("[Notification] Failed to create notification:", error);
    return null;
  }
}

export async function notifyClassroomStudents({
  classroomId,
  title,
  message,
  link,
  targetStudentIds,
}: {
  classroomId: string;
  title: string;
  message: string;
  link?: string;
  targetStudentIds?: string[];
}) {
  try {
    let studentIds: string[] = [];

    if (targetStudentIds && targetStudentIds.length > 0) {
      studentIds = targetStudentIds;
    } else {
      const enrollments = await prisma.enrollment.findMany({
        where: { classroomId },
        select: { userId: true },
      });
      studentIds = enrollments.map((e) => e.userId);
    }

    if (studentIds.length === 0) return [];

    const data = studentIds.map((userId) => ({
      userId,
      title: title.trim(),
      message: message.trim(),
      link: link?.trim() || null,
    }));

    return await prisma.notification.createMany({
      data,
    });
  } catch (error) {
    console.error("[Notification] Failed to notify classroom students:", error);
    return null;
  }
}

export async function notifySubmissionGraded({
  studentId,
  classroomId,
  assignmentTitle,
  grade,
  maxPoints,
  feedback,
}: {
  studentId: string;
  classroomId: string;
  assignmentTitle: string;
  grade: number;
  maxPoints: number;
  feedback?: string | null;
}) {
  try {
    const feedbackSnippet = feedback ? ` • Feedback: ${feedback.slice(0, 80)}` : "";
    return await createNotification({
      userId: studentId,
      title: `Assignment Graded: ${assignmentTitle}`,
      message: `Score: ${grade}/${maxPoints} points (${Math.round((grade / maxPoints) * 100)}%)${feedbackSnippet}`,
      link: `/classroom/${classroomId}?tab=classwork`,
    });
  } catch (error) {
    console.error("[Notification] Failed to notify graded submission:", error);
    return null;
  }
}
