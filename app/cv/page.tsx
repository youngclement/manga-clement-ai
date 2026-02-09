"use client";

import React from "react";

const cvData = {
  personalInfo: {
    name: "Nguyễn Văn An",
    title: "Lập trình viên Full-Stack",
    email: "nguyenvanan@email.com",
    phone: "0901 234 567",
    address: "Quận 1, TP. Hồ Chí Minh",
    summary:
      "Lập trình viên với 5 năm kinh nghiệm trong phát triển web và ứng dụng di động. Có khả năng làm việc độc lập và theo nhóm, luôn cập nhật công nghệ mới nhất.",
  },
  education: {
    school: "Đại học Bách Khoa TP.HCM",
    degree: "Cử nhân Khoa học Máy tính",
    period: "2015 - 2019",
    description:
      "Tốt nghiệp loại Giỏi với GPA 3.5/4.0. Đạt giải Nhì cuộc thi Lập trình ACM cấp trường năm 2018. Tham gia nghiên cứu về Machine Learning và AI.",
  },
  workExperience: [
    {
      company: "Công ty TNHH Công nghệ ABC",
      position: "Senior Full-Stack Developer",
      startDate: "01/2022",
      endDate: "Hiện tại",
      description:
        "Phát triển và bảo trì các ứng dụng web sử dụng React, Next.js và Node.js. Dẫn dắt team 5 người trong các dự án lớn. Tối ưu hóa hiệu suất ứng dụng, giảm 40% thời gian tải trang. Triển khai CI/CD và automated testing.",
    },
    {
      company: "Công ty Cổ phần XYZ Digital",
      position: "Junior Frontend Developer",
      startDate: "06/2019",
      endDate: "12/2021",
      description:
        "Xây dựng giao diện người dùng cho các ứng dụng e-commerce. Làm việc với React, TypeScript và Redux. Phối hợp với team thiết kế để triển khai UI/UX. Tham gia code review và mentoring thực tập sinh.",
    },
  ],
  skills: [
    {
      name: "React / Next.js",
      description:
        "Thành thạo React hooks, Context API, Server Components. Có kinh nghiệm xây dựng ứng dụng quy mô lớn.",
    },
    {
      name: "Node.js / NestJS",
      description:
        "Phát triển REST API và GraphQL. Làm việc với PostgreSQL, MongoDB và Redis.",
    },
    {
      name: "TypeScript",
      description:
        "Sử dụng TypeScript trong tất cả các dự án. Hiểu rõ về type system và generic types.",
    },
    {
      name: "DevOps / Cloud",
      description:
        "Kinh nghiệm với Docker, Kubernetes, AWS và GCP. Triển khai CI/CD pipelines.",
    },
  ],
  activities: [
    {
      organization: "Cộng đồng JavaScript Việt Nam",
      role: "Thành viên tích cực",
      startDate: "2020",
      endDate: "Hiện tại",
      description: "Tham gia các buổi meetup và chia sẻ kiến thức về React và Node.js.",
    },
    {
      organization: "Tình nguyện dạy lập trình cho trẻ em",
      role: "Giảng viên tình nguyện",
      startDate: "2021",
      endDate: "2023",
      description: "Dạy lập trình Scratch và Python cho học sinh tiểu học và THCS.",
    },
  ],
};

export default function CVPage() {
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {}
        <header className="mb-8 border-b-2 border-gray-800 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {cvData.personalInfo.name}
          </h1>
          <p className="text-xl text-gray-600 mb-4">{cvData.personalInfo.title}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>📧 {cvData.personalInfo.email}</span>
            <span>📱 {cvData.personalInfo.phone}</span>
            <span>📍 {cvData.personalInfo.address}</span>
          </div>
          <p className="mt-4 text-gray-700">{cvData.personalInfo.summary}</p>
        </header>

        {}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-300 pb-2">
            HỌC VẤN
          </h2>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-800">
                {cvData.education.school}
              </h3>
              <p className="text-gray-600 italic">{cvData.education.degree}</p>
            </div>
            <span className="text-gray-500 text-sm">{cvData.education.period}</span>
          </div>
          <p className="text-gray-700">{cvData.education.description}</p>
        </section>

        {}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-300 pb-2">
            KINH NGHIỆM LÀM VIỆC
          </h2>
          {cvData.workExperience.map((exp, index) => (
            <div key={index} className="mb-6">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-800">{exp.company}</h3>
                <span className="text-gray-500 text-sm">
                  {exp.startDate} - {exp.endDate}
                </span>
              </div>
              <p className="text-gray-600 italic mb-2">{exp.position}</p>
              <p className="text-gray-700">{exp.description}</p>
            </div>
          ))}
        </section>

        {}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-300 pb-2">
            KỸ NĂNG
          </h2>
          <div className="grid gap-4">
            {cvData.skills.map((skill, index) => (
              <div key={index} className="flex gap-4">
                <span className="font-semibold text-gray-800 min-w-[180px]">
                  {skill.name}
                </span>
                <span className="text-gray-700">{skill.description}</span>
              </div>
            ))}
          </div>
        </section>

        {}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-300 pb-2">
            HOẠT ĐỘNG
          </h2>
          {cvData.activities.map((activity, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-800">
                  {activity.organization}
                </h3>
                <span className="text-gray-500 text-sm">
                  {activity.startDate} - {activity.endDate}
                </span>
              </div>
              <p className="text-gray-600 italic mb-1">{activity.role}</p>
              <p className="text-gray-700">{activity.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
