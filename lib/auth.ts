export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: "TEACHER" | "STUDENT";
  avatar: string;
  title: string;
}

export const DEMO_USERS: Record<string, { name: string; email: string; role: "TEACHER" | "STUDENT"; avatar: string; title: string }> = {
  teacher: {
    name: "Dr. Kamal Hossain",
    email: "kamal@classpulse.edu",
    role: "TEACHER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    title: "Professor of Computer Science",
  },
  student1: {
    name: "MD Abid Hasan",
    email: "abid@classpulse.edu",
    role: "STUDENT",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    title: "CS Undergraduate (Cohort 45)",
  },
  student2: {
    name: "Sarah Ahmed",
    email: "sarah@classpulse.edu",
    role: "STUDENT",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    title: "CS Undergraduate (Cohort 45)",
  },
};

export const DEFAULT_USER_EMAIL = "kamal@classpulse.edu";
