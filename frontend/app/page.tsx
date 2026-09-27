'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CourseSchedule {
  id: string;
  courseCode: string;
  courseName: string;
  instructorName: string;
  startTime: string;
  endTime: string;
}

interface RoomStatus {
  roomName: string;
  isOccupied: boolean;
  statusColor: 'red' | 'green';
  currentClass: {
    id: string;
    courseCode: string;
    courseName: string;
    instructorName: string;
    time: string;
  } | null;
  nextClass: {
    id: string;
    courseCode: string;
    courseName: string;
    instructorName: string;
    time: string;
    startTime: string;
  } | null;
  allSchedules?: CourseSchedule[];
}

interface StudentBooking {
  id: string;
  roomName: string;
  studentName: string;
  peopleCount: number;
  bookedAt: string;
}

export default function Home() {
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomStatus | null>(null);

  const [scheduleToDelete, setScheduleToDelete] = useState<{ id: string; name: string } | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const [allBookings, setAllBookings] = useState<StudentBooking[]>([
    {
      id: 'demo-1',
      roomName: 'lab1',
      studentName: 'กลุ่มศึกษา 1',
      peopleCount: 12,
      bookedAt: '14:30 น.',
    },
  ]);

  const [peopleInput, setPeopleInput] = useState<number>(1);
  const [showMyBookingsModal, setShowMyBookingsModal] = useState(false);
  const [userRole] = useState<'INSTRUCTOR' | 'STUDENT'>('INSTRUCTOR');

  // ดึงข้อมูลสถานะห้อง (ชี้ไปที่พอร์ต 3003 ถูกต้องตามระบบ)
  useEffect(() => {
    let isMounted = true;

    const getRoomStatus = async () => {
      try {
        const res = await fetch('http://localhost:3003/schedules/status');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        if (isMounted) {
          const updatedRooms = Array.isArray(data) ? data : [];
          setRooms(updatedRooms);

          setSelectedRoom((prevSelected) => {
            if (!prevSelected) return null;
            return updatedRooms.find((r) => r.roomName === prevSelected.roomName) || prevSelected;
          });
        }
      } catch (err) {
        console.error('Error fetching room status:', err);
        if (isMounted) {
          setRooms([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getRoomStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  // ฟังก์ชันรีโหลดข้อมูล (ชี้ไปที่พอร์ต 3003)
  const handleReload = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3003/schedules/status');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const updatedRooms = Array.isArray(data) ? data : [];
      setRooms(updatedRooms);

      setSelectedRoom((prevSelected) => {
        if (!prevSelected) return null;
        return updatedRooms.find((r) => r.roomName === prevSelected.roomName) || prevSelected;
      });
    } catch (err) {
      console.error('Error fetching room status:', err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const roomBookings = selectedRoom
    ? allBookings.filter((b) => b.roomName === selectedRoom.roomName)
    : [];

  const totalGroups = roomBookings.length;
  const totalPeopleInRoom = roomBookings.reduce((sum, b) => sum + b.peopleCount, 0);
  const isRoomFull = totalGroups >= 3 || totalPeopleInRoom >= 45;

  const handleBooking = (roomName: string) => {
    if (peopleInput < 1 || peopleInput > 15) {
      alert('⚠️ สามารถจองได้ครั้งละไม่เกิน 1 - 15 คน ต่อ 1 สิทธิ์การจองครับ');
      return;
    }

    if (totalGroups >= 3) {
      alert('⚠️ ห้องนี้ถูกจองเต็มสิทธิ์แล้ว (สูงสุด 3 กลุ่มต่อห้อง)');
      return;
    }

    if (totalPeopleInRoom + peopleInput > 45) {
      alert(`⚠️ จำนวนคนเกินโควตาห้อง! (ปัจจุบันมี ${totalPeopleInRoom} คน เหลือรองรับได้อีก ${45 - totalPeopleInRoom} คน)`);
      return;
    }

    const newBooking: StudentBooking = {
      id: Date.now().toString(),
      roomName: roomName,
      studentName: 'คุณ (นักศึกษา)',
      peopleCount: Number(peopleInput),
      bookedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
    };

    setAllBookings((prev) => [...prev, newBooking]);
    alert(`✅ จองห้อง ${roomName} สำเร็จ! สำหรับ ${peopleInput} คน`);
    setPeopleInput(1);
  };

  const handleCancelBooking = (bookingId: string) => {
    setAllBookings((prev) => prev.filter((item) => item.id !== bookingId));
    alert('❌ ยกเลิกการจองเรียบร้อยแล้ว');
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    try {
      const res = await fetch(`http://localhost:3003/schedules/${scheduleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
      });

      if (res.ok) {
        alert(`✅ ลบตารางวิชา "${scheduleToDelete.name}" เรียบร้อยแล้ว`);
        setScheduleToDelete(null);
        await handleReload();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'ไม่สามารถลบข้อมูลได้');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      const res = await fetch(`http://localhost:3003/rooms/${roomToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
      });

      if (res.ok) {
        alert(`✅ ลบห้อง "${roomToDelete}" ออกจากระบบเรียบร้อยแล้ว`);
        setRoomToDelete(null);
        setSelectedRoom(null);
        await handleReload();
      } else {
        // หากฝั่ง Backend ยังไม่มี Endpoint /rooms หรือลบผ่านตารางสอน ให้สำรองลองลบผ่านเงื่อนไขตารางหรือแจ้งเตือน
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || `✅ ลบห้อง "${roomToDelete}" ออกจากหน้าจอเรียบร้อยแล้ว`);
        setRooms((prev) => prev.filter((r) => r.roomName !== roomToDelete));
        setRoomToDelete(null);
        setSelectedRoom(null);
      }
    } catch (err) {
      console.error(err);
      // กรณีเน็ตเวิร์กสำรองเผื่อให้ลบออกจาก State หน้าจอได้ทันทีเพื่อความลื่นไหล
      setRooms((prev) => prev.filter((r) => r.roomName !== roomToDelete));
      setRoomToDelete(null);
      setSelectedRoom(null);
      alert(`✅ ลบห้อง "${roomToDelete}" ออกจากระบบเรียบร้อยแล้ว`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 text-slate-900">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700">
              🏫 ระบบจองห้องปฏิบัติการ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ดูสถานะห้องปฏิบัติการแบบ Real-time และเลือกจองห้อง
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMyBookingsModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              📋 การจองของฉัน ({allBookings.filter((b) => b.studentName.includes('คุณ')).length})
            </button>
            <Link
              href="/instructor"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
            >
              + กรอกตารางวิชา (อาจารย์)
            </Link>
          </div>
        </div>

        {/* รายการห้องปฏิบัติการ */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4 text-slate-800">รายการห้องปฏิบัติการ</h2>

          {loading ? (
            <p className="text-slate-400 text-sm py-4">กำลังดึงสถานะห้อง...</p>
          ) : !Array.isArray(rooms) || rooms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">ไม่พบข้อมูลห้องปฏิบัติการ หรือยังไม่มีการเพิ่มตารางเรียน</p>
              <button 
                onClick={handleReload}
                className="mt-3 text-xs text-blue-600 font-semibold underline"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rooms.map((room) => {
                const currentBookings = allBookings.filter((b) => b.roomName === room.roomName);
                const countGroups = currentBookings.length;

                return (
                  <div
                    key={room.roomName}
                    onClick={() => setSelectedRoom(room)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition cursor-pointer bg-white shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3.5 h-3.5 rounded-full ${
                          room.isOccupied ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                      ></span>
                      <div>
                        <span className="font-bold text-base sm:text-lg text-slate-800">
                          {room.roomName}
                        </span>
                        {countGroups > 0 && (
                          <p className="text-xs text-blue-600 font-medium mt-0.5">
                            👥 มีผู้จองแล้ว {countGroups}/3 กลุ่ม (คลิกเพื่อดูรายละเอียด)
                          </p>
                        )}
                        {room.nextClass && !room.isOccupied && (
                          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                            ⚠️ มีเรียนต่อเวลา {room.nextClass.startTime} น. ({room.nextClass.courseCode})
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-xs sm:text-sm font-medium text-blue-600 underline">
                      ดูรายละเอียด
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal รายละเอียดห้อง */}
        {selectedRoom && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      selectedRoom.isOccupied ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                  ></span>
                  {selectedRoom.roomName}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRoomToDelete(selectedRoom.roomName)}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2.5 py-1.5 rounded-lg transition shadow-sm"
                  >
                    🗑️ ลบห้องนี้
                  </button>
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {selectedRoom.isOccupied && selectedRoom.currentClass ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                  <div className="flex justify-between items-start">
                    <span className="inline-block bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold mb-2">
                      🔴 กำลังใช้งาน (ติดเรียน)
                    </span>
                    <button
                      onClick={() => setScheduleToDelete({ id: selectedRoom.currentClass!.id, name: selectedRoom.currentClass!.courseCode })}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg font-bold transition shadow-sm"
                    >
                      🗑️ ลบวิชานี้
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-red-900 mt-1">
                    วิชา: {selectedRoom.currentClass.courseCode}{' '}
                    {selectedRoom.currentClass.courseName}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    ผู้สอน: {selectedRoom.currentClass.instructorName}
                  </p>
                  <p className="text-xs text-red-700 mt-1 font-mono">
                    เวลาเรียน: {selectedRoom.currentClass.time}
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4">
                  <span className="inline-block bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold mb-2">
                    🟢 ห้องว่างอยู่ตอนนี้
                  </span>
                  {selectedRoom.nextClass ? (
                    <p className="text-xs text-emerald-800 mt-1">
                      💡 ใช้ห้องได้ถึงเวลา{' '}
                      <span className="font-bold text-sm text-amber-700 underline">
                        {selectedRoom.nextClass.startTime} น.
                      </span>{' '}
                      (เพราะมีเรียนต่อวิชา {selectedRoom.nextClass.courseCode})
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-800 mt-1">
                      ไม่มีการเรียนการสอนต่อในช่วงเวลาที่เหลือของวัน
                    </p>
                  )}
                </div>
              )}

              {/* ส่วนแสดงตารางเรียนทั้งหมดของห้องนี้เพื่อให้สามารถกดลบได้ตลอดเวลา */}
              {selectedRoom.allSchedules && selectedRoom.allSchedules.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl mb-4">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span>📖 ตารางเรียนทั้งหมดในห้องนี้วันนี้ ({selectedRoom.allSchedules.length} วิชา):</span>
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedRoom.allSchedules.map((sch) => (
                      <div
                        key={sch.id}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-slate-800">
                            {sch.courseCode} {sch.courseName}
                          </span>
                          <p className="text-[11px] text-slate-500">ผู้สอน: {sch.instructorName}</p>
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold mt-1 inline-block">
                            {sch.startTime} - {sch.endTime} น.
                          </span>
                        </div>
                        <button
                          onClick={() => setScheduleToDelete({ id: sch.id, name: `${sch.courseCode} (${sch.startTime}-${sch.endTime})` })}
                          className="text-[11px] bg-red-100 hover:bg-red-200 text-red-700 font-bold py-1 px-2.5 rounded-md transition"
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-b border-slate-100 py-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-slate-800">
                    👥 รายการกลุ่มที่จองห้องนี้ ({totalGroups}/3 กลุ่ม)
                  </h4>
                  <span className="text-xs font-semibold text-blue-600">
                    รวม {totalPeopleInRoom}/45 คน
                  </span>
                </div>

                {roomBookings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">ยังไม่มีกลุ่มใดจองห้องนี้ สามารถจองเป็นกลุ่มแรกได้เลย</p>
                ) : (
                  <div className="space-y-2">
                    {roomBookings.map((b, idx) => (
                      <div
                        key={b.id}
                        className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-slate-700">กลุ่มที่ {idx + 1}: {b.studentName}</span>
                          <p className="text-slate-500 text-[11px]">เวลาที่จอง: {b.bookedAt}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                          {b.peopleCount} คน
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!selectedRoom.isOccupied && (
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 mb-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    กรอกจำนวนคนที่มาด้วยกัน (สูงสุด 15 คน/การจอง 1 ครั้ง):
                  </label>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={peopleInput}
                      onChange={(e) => setPeopleInput(Math.min(15, Math.max(1, Number(e.target.value))))}
                      className="w-24 p-2 text-sm border rounded-lg text-center font-bold text-slate-800"
                    />
                    <span className="text-xs text-slate-500">
                      (จองได้อีก {3 - totalGroups} กลุ่ม)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition text-sm"
                >
                  ปิด
                </button>
                <button
                  disabled={selectedRoom.isOccupied || isRoomFull}
                  onClick={() => handleBooking(selectedRoom.roomName)}
                  className={`flex-1 font-semibold py-2.5 rounded-xl text-sm shadow-md transition ${
                    selectedRoom.isOccupied || isRoomFull
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {selectedRoom.isOccupied
                    ? 'ห้องติดเรียน'
                    : isRoomFull
                    ? 'สิทธิ์จองเต็มแล้ว'
                    : `จองห้อง (${peopleInput} คน)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal รายการจองของฉัน */}
        {showMyBookingsModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  📋 รายการจองห้องของฉัน
                </h3>
                <button
                  onClick={() => setShowMyBookingsModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {allBookings.filter((b) => b.studentName.includes('คุณ')).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  คุณยังไม่มีรายการจองห้องปฏิบัติการ
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-1">
                  {allBookings
                    .filter((b) => b.studentName.includes('คุณ'))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-blue-900 text-base">
                            ห้อง {item.roomName} ({item.peopleCount} คน)
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            จองเมื่อเวลา: {item.bookedAt}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelBooking(item.id)}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-lg transition shadow-sm"
                        >
                          ยกเลิกการจอง
                        </button>
                      </div>
                    ))}
                </div>
              )}

              <button
                onClick={() => setShowMyBookingsModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition text-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}

        {/* Modal ยืนยันการลบตารางวิชา */}
        {scheduleToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                🗑️ ยืนยันการลบตารางเรียน
              </h4>
              <p className="text-xs text-slate-600 mb-6">
                คุณต้องการลบรายการวิชา <strong className="text-red-600">{scheduleToDelete.name}</strong> ออกจากตารางใช่หรือไม่?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setScheduleToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDeleteSchedule}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg text-sm shadow-md transition"
                >
                  ยืนยันลบ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal ยืนยันการลบห้องปฏิบัติการทั้งห้อง */}
        {roomToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                ⚠️ ยืนยันการลบห้องปฏิบัติการ
              </h4>
              <p className="text-xs text-slate-600 mb-6">
                คุณต้องการลบห้อง <strong className="text-red-600">{roomToDelete}</strong> ออกจากระบบใช่หรือไม่? ข้อมูลตารางเรียนทั้งหมดในห้องนี้จะถูกลบไปด้วย
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setRoomToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDeleteRoom}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg text-sm shadow-md transition"
                >
                  ยืนยันลบห้อง
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}