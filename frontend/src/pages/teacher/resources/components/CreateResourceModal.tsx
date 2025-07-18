import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Upload,
  Button,
  message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks";
import { teacherService } from "@/services";

const { Option } = Select;
const { TextArea } = Input;

interface CreateResourceModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: FormData) => void;
  isSubmitting: boolean;
}

/**
 * Modal component for creating a new resource
 */
const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  isSubmitting,
}) => {
  const [form] = Form.useForm();

  // API call for courses
  const coursesQuery = useApi(
    () => teacherService.getMyCourses({ limit: 100 }),
    { immediate: true }
  );

  const responseData = coursesQuery.data?.data as any;
  const courses = responseData?.items || [];

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleSubmit = (values: any) => {
    const formData = new FormData();

    // Add form fields
    formData.append("title", values.title);
    formData.append("description", values.description || "");
    formData.append("courseId", values.courseId);
    formData.append("isPublic", values.isPublic ? "true" : "false");

    // Add file
    if (values.document && values.document[0]) {
      formData.append("document", values.document[0].originFileObj);
    }

    onSubmit(formData);
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const beforeUpload = (file: File) => {
    const isValidType =
      file.type.startsWith("image/") ||
      file.type.startsWith("video/") ||
      file.type.startsWith("application/");

    if (!isValidType) {
      message.error("You can only upload image, video, or document files!");
      return false;
    }

    const isLt50M = file.size / 1024 / 1024 < 50;
    if (!isLt50M) {
      message.error("File must be smaller than 50MB!");
      return false;
    }

    return false; // Prevent auto upload
  };

  return (
    <Modal
      title="Create New Resource"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          isPublic: false,
        }}
      >
        <Form.Item
          name="title"
          label="Resource Title"
          rules={[
            { required: true, message: "Please enter resource title" },
            { min: 3, message: "Title must be at least 3 characters" },
          ]}
        >
          <Input placeholder="Enter resource title" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea
            placeholder="Enter resource description"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          name="courseId"
          label="Course"
          rules={[{ required: true, message: "Please select a course" }]}
        >
          <Select placeholder="Select course" loading={coursesQuery.loading}>
            {courses.map((course: any) => (
              <Option key={course.id} value={course.id}>
                {course.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="document"
          label="Upload File"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[{ required: true, message: "Please upload a file" }]}
        >
          <Upload.Dragger
            name="document"
            beforeUpload={beforeUpload}
            maxCount={1}
            accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for images, videos, documents (PDF, Word, Excel,
              PowerPoint, etc.)
              <br />
              Maximum file size: 50MB
            </p>
          </Upload.Dragger>
        </Form.Item>

        <Form.Item
          name="isPublic"
          label="Make Public"
          valuePropName="checked"
          extra="Public resources are visible to all students"
        >
          <Switch />
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end">
          <Button onClick={onCancel} className="mr-2">
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Create Resource
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateResourceModal;
