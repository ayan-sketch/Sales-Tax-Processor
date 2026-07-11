import React from 'react'
import {
  FileText,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { useDocuments } from '../hooks/useDocuments'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  subtitle?: string
}

function StatCard({ label, value, icon, iconBg, iconColor, trend, trendValue, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
          {(trend || subtitle) && (
            <div className="mt-2 flex items-center gap-1.5">
              {trend === 'up' && (
                <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                  {trendValue}
                </span>
              )}
              {trend === 'down' && (
                <span className="inline-flex items-center text-xs font-medium text-red-600">
                  <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                  {trendValue}
                </span>
              )}
              {trend === 'flat' && (
                <span className="inline-flex items-center text-xs font-medium text-slate-500">
                  <Minus className="h-3.5 w-3.5 mr-0.5" />
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-slate-400">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 p-3 rounded-xl ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

export function DocumentStatsCards() {
  const { stats } = useDocuments()

  const getMonthlyTrend = () => {
    if (!stats?.uploads_this_month || !stats?.uploads_previous_month) return undefined
    if (stats.uploads_previous_month === 0) return { trend: 'up' as const, value: 'New' }
    const change = ((stats.uploads_this_month - stats.uploads_previous_month) / stats.uploads_previous_month) * 100
    if (change > 0) return { trend: 'up' as const, value: `+${Math.round(change)}%` }
    if (change < 0) return { trend: 'down' as const, value: `${Math.round(change)}%` }
    return { trend: 'flat' as const, value: '0%' }
  }

  const monthlyTrend = getMonthlyTrend()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        label="Total Documents"
        value={stats?.total_documents?.toLocaleString() ?? '—'}
        icon={<FileText className="h-6 w-6" />}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        subtitle={stats ? `${stats.total_pdf + stats.total_excel} indexed` : undefined}
      />

      <StatCard
        label="PDF Files"
        value={stats?.total_pdf?.toLocaleString() ?? '—'}
        icon={<FileText className="h-6 w-6" />}
        iconBg="bg-red-50"
        iconColor="text-red-500"
        subtitle={
          stats?.total_documents
            ? `${Math.round((stats.total_pdf / stats.total_documents) * 100)}% of total`
            : undefined
        }
      />

      <StatCard
        label="Excel Files"
        value={stats?.total_excel?.toLocaleString() ?? '—'}
        icon={<FileSpreadsheet className="h-6 w-6" />}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-500"
        subtitle={
          stats?.total_documents
            ? `${Math.round((stats.total_excel / stats.total_documents) * 100)}% of total`
            : undefined
        }
      />

      <StatCard
        label="Recent Uploads"
        value={stats?.recent_uploads_24h?.toLocaleString() ?? '—'}
        icon={<Upload className="h-6 w-6" />}
        iconBg="bg-violet-50"
        iconColor="text-violet-600"
        subtitle="last 24 hours"
      />

      <StatCard
        label="Missing Documents"
        value={stats?.missing_documents?.toLocaleString() ?? '—'}
        icon={<AlertTriangle className="h-6 w-6" />}
        iconBg="bg-red-50"
        iconColor="text-red-500"
        subtitle={stats?.total_clients_with_gaps ? `${stats.total_clients_with_gaps} clients` : undefined}
      />

      <StatCard
        label="This Month"
        value={stats?.uploads_this_month?.toLocaleString() ?? '—'}
        icon={<Calendar className="h-6 w-6" />}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        trend={monthlyTrend?.trend}
        trendValue={monthlyTrend?.value}
      />
    </div>
  )
}