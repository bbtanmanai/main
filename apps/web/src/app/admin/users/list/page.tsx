
"use client";

import React from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Download,
  Shield,
  CreditCard,
  User
} from 'lucide-react';

export default function UserListPage() {
  const users = [
    { id: 1, name: "김크리에", email: "kim@creator.com", tier: "PRO", status: "Active", joinDate: "2026-02-15", lastLogin: "방금 전", projects: 42 },
    { id: 2, name: "이인사이트", email: "lee@insight.net", tier: "BUSINESS", status: "Active", joinDate: "2026-01-10", lastLogin: "3시간 전", projects: 128 },
    { id: 3, name: "박지식", email: "park@knowledge.kr", tier: "FREE", status: "Idle", joinDate: "2026-03-01", lastLogin: "2일 전", projects: 5 },
    { id: 4, name: "최오토", email: "choi@automation.io", tier: "PRO", status: "Suspended", joinDate: "2025-12-20", lastLogin: "1개월 전", projects: 89 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">전체 회원 목록</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">시스템을 이용 중인 크리에이터 정보를 통합 관리합니다.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Download size={14} /> 목록 내보내기
          </button>
          <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md">
            <UserPlus size={14} /> 신규 회원 등록
          </button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="이름, 이메일로 검색..." 
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-100">
            <Filter size={14} /> 필터링
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">회원 정보</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">구독 등급</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">상태</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">콘텐츠 생산</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">가입일</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group text-sm">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                        <User size={16} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center w-fit gap-1.5 ${
                      user.tier === 'BUSINESS' ? 'bg-purple-50 text-purple-600' :
                      user.tier === 'PRO' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <CreditCard size={12} /> {user.tier}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'Active' ? 'bg-emerald-500' :
                        user.status === 'Suspended' ? 'bg-rose-500' : 'bg-slate-300'
                      }`}></div>
                      <span className="font-semibold text-slate-600">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-black text-slate-700">{user.projects}건</td>
                  <td className="px-6 py-5 text-xs text-slate-500 font-medium">{user.joinDate}</td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
