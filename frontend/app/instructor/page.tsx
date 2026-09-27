'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InstructorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    instructorName: '',
    courseCode: '',
    courseName: '',
    roomName: '',
    day: 'MONDAY',
    startTime: '09:00',
    endTime: '12:00',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomName.trim()) {
      alert('กรุณากรอกชื่อห้องปฏิบัติการ');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('บันทึกข้อมูลรายวิชาเรียบร้อยแล้ว!');
        router.push('/');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Backend Error Response:', errorData);
        alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล (${errorData.message || res.statusText})`);
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8 flex justify-center items-center">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-lg border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          👨‍🏫 แบบฟอร์มกรอกตารางเรียน (สำหรับอาจารย์)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mb-6">
          กรอกข้อมูลการใช้ห้องปฏิบัติการเพื่อบันทึกลงในระบบ
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              ชื่อผู้สอน
            </label>
            <input
              type="text"
              required
              placeholder="เช่น อ.ดร.สมชาย ใจดี"
              value={formData.instructorName}
              onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                รหัสวิชา
              </label>
              <input
                type="text"
                required
                placeholder="เช่น คม327"
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                ห้องปฏิบัติการ
              </label>
              <input
                type="text"
                required
                placeholder="เช่น Lab คอม 1"
                value={formData.roomName}
                onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              ชื่อวิชา
            </label>
            <input
              type="text"
              required
              placeholder="เช่น การพัฒนาเว็บแอปพลิเคชัน"
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              วันในสัปดาห์
            </label>
            <select
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-white"
            >
              <option value="MONDAY">วันจันทร์ (Monday)</option>
              <option value="TUESDAY">วันอังคาร (Tuesday)</option>
              <option value="WEDNESDAY">วันพุธ (Wednesday)</option>
              <option value="THURSDAY">วันพฤหัสบดี (Thursday)</option>
              <option value="FRIDAY">วันศุกร์ (Friday)</option>
              <option value="SATURDAY">วันเสาร์ (Saturday)</option>
              <option value="SUNDAY">วันอาทิตย์ (Sunday)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                เวลาเริ่มต้น
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                เวลาสิ้นสุด
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 mt-2 text-sm shadow-md disabled:bg-slate-400"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกตารางเรียนและไปยังหน้าจอง'}
          </button>
        </form>
      </div>
    </main>
  );
}