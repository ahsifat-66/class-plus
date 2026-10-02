import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  checkHasAdminAccess,
  resolveUserRole,
} from "@/lib/auth/roles";
import {
  getAllFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats,
} from "@/lib/feedback/store";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function verifyAdminCaller(req: NextRequest) {
  const session = await getSessionUser(req);
  let callerEmail = session?.email;

  if (!callerEmail) {
    callerEmail = req.cookies.get("classpulse_user_email")?.value;
  }

  if (!callerEmail) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: callerEmail },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!dbUser) return null;

  const role = resolveUserRole(dbUser);
  const caller = { ...dbUser, role };

  if (!checkHasAdminAccess(caller)) {
    return null;
  }

  return caller;
}

export async function GET(req: NextRequest) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json(
        { error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const feedbacks = await getAllFeedbacks();
    const stats = await getFeedbackStats();

    return NextResponse.json({
      feedbacks,
      stats,
    });
  } catch (error: any) {
    console.error("Admin feedbacks GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json(
        { error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !["new", "reviewed"].includes(status)) {
      return NextResponse.json(
        { error: "Valid feedback id and status ('new' | 'reviewed') are required." },
        { status: 400 }
      );
    }

    const updated = await updateFeedbackStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: "Feedback not found." },
        { status: 404 }
      );
    }

    const stats = await getFeedbackStats();

    return NextResponse.json({
      success: true,
      feedback: updated,
      stats,
    });
  } catch (error: any) {
    console.error("Admin feedbacks PATCH error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json(
        { error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (err) {
        // ignore
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Feedback id is required." },
        { status: 400 }
      );
    }

    const deleted = await deleteFeedback(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Feedback not found or already deleted." },
        { status: 404 }
      );
    }

    const stats = await getFeedbackStats();

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully.",
      stats,
    });
  } catch (error: any) {
    console.error("Admin feedbacks DELETE error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
