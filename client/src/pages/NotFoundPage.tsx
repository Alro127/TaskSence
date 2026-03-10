import { useNavigate } from "react-router-dom";
import { Zap, ArrowLeft, Home, SearchX } from "lucide-react";

import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold text-foreground">TaskSense</span>
      </div>

      {/* Illustration area */}
      <div className="mb-6 flex items-center justify-center rounded-full bg-muted p-8">
        <SearchX className="h-16 w-16 text-muted-foreground" />
      </div>

      {/* Text content */}
      <h1 className="mb-2 text-7xl font-extrabold tracking-tight text-primary">
        404
      </h1>
      <h2 className="mb-3 text-2xl font-semibold text-foreground">
        Trang không tìm thấy
      </h2>
      <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
        Đường dẫn bạn đang truy cập không tồn tại hoặc đã bị di chuyển. Hãy
        kiểm tra lại URL hoặc quay về trang chính.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Button
          onClick={() =>
            navigate(isAuthenticated ? "/dashboard" : "/auth/login", {
              replace: true,
            })
          }
        >
          <Home className="mr-2 h-4 w-4" />
          {isAuthenticated ? "Về Dashboard" : "Về trang đăng nhập"}
        </Button>
      </div>
    </div>
  );
}
