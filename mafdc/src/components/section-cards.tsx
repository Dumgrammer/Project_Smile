import { IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface SectionCardsProps {
  totalVisitors?: number;
  activePatients?: number;
  totalRevenue?: number;
  growthRate?: number;
  loading?: boolean;
  error?: string | null;
}

export function SectionCards({
  totalVisitors,
  activePatients,
  loading,
  error,
}: SectionCardsProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-32 text-red-500">
        {error}
      </div>
    );
  }
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card border border-slate-200 shadow-sm">
        <CardHeader>
          <CardDescription className="text-slate-500">Total Visitors (This Month)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalVisitors ?? '--'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-violet-600 border-slate-200">
              <IconTrendingUp className="text-violet-500" />
              This Month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-slate-500">Unique patients with appointments this month</div>
        </CardFooter>
      </Card>
      <Card className="@container/card border border-slate-200 shadow-sm">
        <CardHeader>
          <CardDescription className="text-slate-500">Active Patients</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activePatients ?? '--'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600 border-slate-200">
              <IconTrendingUp className="text-green-500" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-slate-500">Currently active patient records</div>
        </CardFooter>
      </Card>
      <Card className="@container/card border border-slate-200 shadow-sm">
        <CardHeader>
          <CardDescription className="text-slate-500">Inquiries</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activePatients ?? '--'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600 border-slate-200">
              <IconTrendingUp className="text-green-500" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-slate-500">Total inquiries received</div>
        </CardFooter>
      </Card>
      <Card className="@container/card border border-slate-200 shadow-sm">
        <CardHeader>
          <CardDescription className="text-slate-500">Scheduled Appointments</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activePatients ?? '--'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-violet-600 border-slate-200">
              <IconTrendingUp className="text-violet-500" />
              This Month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-slate-500">Total scheduled appointments this month</div>
        </CardFooter>
      </Card>

    </div>
  )
}
