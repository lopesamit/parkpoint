import type { Metadata } from "next";
import AuthLayout from "../components/AuthLayout";
import ResetPasswordForm from "../components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <AuthLayout>
      <ResetPasswordForm token={searchParams.token ?? ""} />
    </AuthLayout>
  );
}
