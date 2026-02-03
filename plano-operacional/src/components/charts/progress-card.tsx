import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MousePointer2 } from 'lucide-react'

interface ProgressItem {
  label: string
  value: number
  total: number
  color?: string
}

interface ProgressCardProps {
  title: string
  items: ProgressItem[]
  maxVisible?: number
  showPercentage?: boolean
  onItemClick?: (item: ProgressItem) => void
  selectedItem?: string | null
  interactiveMode?: boolean
}

export function ProgressCard({
  title,
  items,
  maxVisible = 5,
  showPercentage = true,
  onItemClick,
  selectedItem,
  interactiveMode = false
}: ProgressCardProps) {
  const { t } = useTranslation()
  const visibleItems = items.slice(0, maxVisible)
  const hasMore = items.length > maxVisible
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const renderProgressItem = (item: ProgressItem, index: number) => {
    const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0
    const isSelected = selectedItem === item.label
    const isClickable = interactiveMode && onItemClick
    const isDimmed = selectedItem !== null && !isSelected

    return (
      <div
        key={index}
        className={`space-y-2 rounded-md p-2 transition-all ${
          isClickable ? 'cursor-pointer hover:bg-accent' : ''
        }`}
        onClick={() => isClickable && onItemClick(item)}
      >
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium transition-opacity ${isDimmed ? 'opacity-50' : 'opacity-100'}`}>
            {item.label}
          </span>
          <span className={`text-muted-foreground transition-opacity ${isDimmed ? 'opacity-50' : 'opacity-100'}`}>
            {item.value}
            {showPercentage && ` (${percentage.toFixed(1)}%)`}
          </span>
        </div>
        <Progress
          value={percentage}
          className="h-2"
          indicatorColor={item.color}
        />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {interactiveMode && (
          <Badge variant="outline" className="gap-1">
            <MousePointer2 className="h-3 w-3" />
            {t('common.clickable')}
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        {visibleItems.map((item, index) => renderProgressItem(item, index))}
      </div>
      {hasMore && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
            >
              {t('common.showMore', { count: items.length - maxVisible })}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{title} - Todas</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {items.map((item, index) => renderProgressItem(item, index))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
