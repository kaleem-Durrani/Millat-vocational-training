import React from "react";
import { Form, Input, Button, Typography, Checkbox } from "antd";
import { UserOutlined, LockOutlined, SafetyOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/common/constants";
import LoginTypeSelector, { LoginType } from "./LoginTypeSelector";
import { useAuth } from "@/context/AuthContext";
import { LoginCredentials } from "@/common/types";

const { Title, Text } = Typography;

interface AdminLoginProps {
  className?: string;
  onTypeChange: (type: LoginType) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({
  className = "",
  onTypeChange,
}) => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [form] = Form.useForm();

  const onFinish = async (values: LoginCredentials) => {
    try {
      await login(values, "admin");
      // Admins don't need verification, so redirect directly to dashboard
      navigate(ROUTES.ADMIN.DASHBOARD);
    } catch (error) {
      // Error handling is done in the AuthContext
      console.error("Login failed:", error);
    }
  };

  return (
    <div className={`p-6 flex flex-col ${className}`}>
      <div className="mb-6 glass-login-selector mx-auto">
        <LoginTypeSelector selectedType="admin" onChange={onTypeChange} />
      </div>

      <Title level={2} className="mb-4 text-center text-indigo-700">
        Administrator Login
      </Title>

      <div className="flex justify-center mb-4">
        <SafetyOutlined className="text-5xl text-indigo-600" />
      </div>

      <Text className="block text-center mb-6 text-gray-600">
        This area is restricted to authorized administrators only.
      </Text>

      <Form
        form={form}
        name="admin_login"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        size="large"
        className="max-w-md mx-auto w-full"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Please enter your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Admin Email"
            className="rounded-lg py-2"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please enter your password!" }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Password"
            className="rounded-lg py-2"
          />
        </Form.Item>

        <Form.Item>
          <div className="flex justify-between items-center">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Forgot password?
            </Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            className="w-full rounded-lg h-12 text-lg bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AdminLogin;
