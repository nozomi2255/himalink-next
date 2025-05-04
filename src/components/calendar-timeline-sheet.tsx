"use client"

import type React from "react"

import { format, isToday, isTomorrow, isYesterday, compareAsc, isSameDay } from "date-fns"
import { ja } from "date-fns/locale"
import { useState, useRef, useEffect } from "react"
import { Plus, Clock, MapPin, Users, GripHorizontal, ChevronDown, ChevronUp, X, Edit, Trash2 } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// イベントの型定義
interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string // HH:mm形式
  endTime?: string // HH:mm形式
  date: Date
  location?: string
  attendees?: string[]
  category?: string
}

interface CalendarTimelineSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  selectedEvent?: CalendarEvent | null
  events: CalendarEvent[]
  onAddEvent: (date: Date, position?: string) => void
}

export function CalendarTimelineSheet({
  isOpen,
  onOpenChange,
  selectedDate,
  selectedEvent,
  events,
  onAddEvent,
}: CalendarTimelineSheetProps) {
  // シートの高さを管理するstate
  const [sheetHeight, setSheetHeight] = useState(70)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartYRef = useRef(0)
  const startHeightRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 新規予定追加のstate
  const [addEventDate, setAddEventDate] = useState<Date | null>(null)
  const [addEventPosition, setAddEventPosition] = useState<string | null>(null)

  // イベント詳細表示のstate
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

  // 全イベントを日付でソート
  const sortedEvents = [...events].sort((a, b) => compareAsc(a.date, b.date) || a.startTime.localeCompare(b.startTime))

  // 日付ごとにイベントをグループ化（予定がある日のみ）
  const eventsByDate = sortedEvents.reduce(
    (groups, event) => {
      const dateStr = format(event.date, "yyyy-MM-dd")
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(event)
      return groups
    },
    {} as Record<string, CalendarEvent[]>,
  )

  // 予定がある日付のみの配列
  const datesWithEvents = Object.keys(eventsByDate)
    .map((dateStr) => new Date(dateStr))
    .sort(compareAsc)

  // ドラッグ開始時の処理
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    dragStartYRef.current = clientY
    startHeightRef.current = sheetHeight
    document.addEventListener("mousemove", handleDragMove)
    document.addEventListener("touchmove", handleDragMove)
    document.addEventListener("mouseup", handleDragEnd)
    document.addEventListener("touchend", handleDragEnd)
  }

  // ドラッグ中の処理
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY
    const deltaY = dragStartYRef.current - clientY
    const windowHeight = window.innerHeight
    const deltaPercent = (deltaY / windowHeight) * 100
    let newHeight = startHeightRef.current + deltaPercent
    newHeight = Math.max(20, Math.min(90, newHeight))
    setSheetHeight(newHeight)
  }

  // ドラッグ終了時の処理
  const handleDragEnd = () => {
    document.removeEventListener("mousemove", handleDragMove)
    document.removeEventListener("touchmove", handleDragMove)
    document.removeEventListener("mouseup", handleDragEnd)
    document.removeEventListener("touchend", handleDragEnd)
  }

  // 予定追加ボタンがクリックされたときの処理
  const handleAddEventClick = (date: Date, position?: string) => {
    setAddEventDate(date)
    setAddEventPosition(position || null)
    setExpandedEventId(null) // 詳細表示を閉じる

    // 追加位置までスクロール
    setTimeout(() => {
      const addFormElement = document.getElementById(`add-form-${position || "default"}`)
      if (addFormElement && scrollRef.current) {
        addFormElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 100)
  }

  // 予定追加フォームを閉じる
  const handleCloseAddForm = () => {
    setAddEventDate(null)
    setAddEventPosition(null)
  }

  // イベント詳細の表示/非表示を切り替え
  const toggleEventDetails = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId)
    setAddEventDate(null) // 追加フォームを閉じる

    // 詳細表示までスクロール
    if (expandedEventId !== eventId) {
      setTimeout(() => {
        const eventElement = document.getElementById(`event-details-${eventId}`)
        if (eventElement && scrollRef.current) {
          eventElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    }
  }

  // 選択された日付またはイベントが変更されたときの処理
  useEffect(() => {
    if (selectedEvent) {
      // イベントが選択された場合、そのイベントの詳細を表示
      setExpandedEventId(selectedEvent.id)
      setAddEventDate(null)

      // 選択されたイベントの位置までスクロール
      setTimeout(() => {
        const eventElement = document.getElementById(`event-${selectedEvent.id}`)
        if (eventElement && scrollRef.current) {
          eventElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    } else if (selectedDate) {
      // 日付が選択された場合、その日付に予定追加フォームを表示
      setAddEventDate(selectedDate)
      setAddEventPosition("day-start")
      setExpandedEventId(null)

      // 日付の位置までスクロール
      setTimeout(() => {
        const dateElement = document.getElementById(`date-${format(selectedDate, "yyyy-MM-dd")}`)
        if (dateElement && scrollRef.current) {
          dateElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    }
  }, [selectedDate, selectedEvent])

  // 日付の表示形式を整形
  const formatDateHeader = (date: Date) => {
    if (isToday(date)) {
      return `今日 (${format(date, "M/d")})`
    } else if (isTomorrow(date)) {
      return `明日 (${format(date, "M/d")})`
    } else if (isYesterday(date)) {
      return `昨日 (${format(date, "M/d")})`
    } else {
      return format(date, "yyyy年M月d日 (E)",)
    }
  }

  // 予定追加フォームをレンダリング
  const renderAddEventForm = (date: Date, position: string) => {
    if (!addEventDate || !isSameDay(addEventDate, date) || addEventPosition !== position) {
      return null
    }

    return (
      <div
        id={`add-form-${position}`}
        className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-in fade-in"
      >
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm">新しい予定を追加</h4>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCloseAddForm}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <Input placeholder="タイトル" className="bg-white" />
          <div className="flex gap-2">
            <Input placeholder="開始時間" type="time" className="bg-white" />
            <Input placeholder="終了時間" type="time" className="bg-white" />
          </div>
          <Input placeholder="場所（任意）" className="bg-white" />
          <Textarea placeholder="詳細（任意）" className="bg-white" rows={2} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleCloseAddForm}>
              キャンセル
            </Button>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
              保存
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // イベント詳細をレンダリング
  const renderEventDetails = (event: CalendarEvent) => {
    if (expandedEventId !== event.id) {
      return null
    }

    return (
      <div
        id={`event-details-${event.id}`}
        className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-in fade-in"
      >
        <div className="space-y-3">
          {event.description && (
            <div className="text-sm">
              <p className="whitespace-pre-line">{event.description}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {event.startTime}
              {event.endTime ? ` 〜 ${event.endTime}` : ""}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {event.attendees.slice(0, 3).map((attendee, i) => (
                  <Avatar key={i} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback>{attendee.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {event.attendees.length > 3 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    +{event.attendees.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm">
              <Edit className="h-3.5 w-3.5 mr-1" />
              編集
            </Button>
            <Button variant="outline" size="sm" className="text-red-500">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              削除
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="bottom"
        className="rounded-t-xl overflow-hidden flex flex-col bg-white border-t border-x shadow-lg p-0"
        style={{ height: `${sheetHeight}vh` }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* ドラッグハンドル */}
        <div
          className="w-full py-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing bg-gray-50"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          ref={sheetRef}
        >
          <GripHorizontal className="h-5 w-5 text-gray-400" />
        </div>

        <SheetHeader className="px-4 py-2">
          <SheetTitle className="text-xl font-bold">タイムライン</SheetTitle>
        </SheetHeader>
        <Separator />

        <ScrollArea className="flex-1" ref={scrollRef}>
          {/* タイムライン表示（予定がある日のみ） */}
          <div className="divide-y">
            {datesWithEvents.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd")
              const eventsOnDate = eventsByDate[dateStr] || []

              return (
                <div key={dateStr} id={`date-${dateStr}`} className="py-2">
                  {/* 日付ヘッダー */}
                  <div className="sticky top-0 bg-white px-4 py-2 z-10 flex justify-between items-center">
                    <h3 className="font-medium">{formatDateHeader(date)}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleAddEventClick(date, "day-start")}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">予定を追加</span>
                    </Button>
                  </div>

                  {/* 日付の先頭に予定追加フォーム */}
                  <div className="px-4 mt-2">{renderAddEventForm(date, "day-start")}</div>

                  {/* イベントリスト */}
                  <div className="space-y-4 px-4 mt-2">
                    {eventsOnDate.map((event, index) => (
                      <div key={event.id} className="space-y-2">
                        {/* イベントカード */}
                        <div
                          id={`event-${event.id}`}
                          className={`p-3 rounded-lg border ${
                            expandedEventId === event.id ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
                          } shadow-sm`}
                          onClick={() => toggleEventDetails(event.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-2">
                              <div className="text-sm font-medium text-slate-500 min-w-[45px] mt-0.5">
                                {event.startTime}
                              </div>
                              <div>
                                <div className="font-medium">{event.title}</div>
                                {event.location && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {event.category && (
                                <Badge variant="outline" className="text-xs">
                                  {event.category}
                                </Badge>
                              )}
                              {expandedEventId === event.id ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* イベント詳細（展開時） */}
                        {renderEventDetails(event)}

                        {/* 予定追加ボタン（イベントの間） */}
                        <div className="flex justify-center my-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 rounded-full text-xs text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddEventClick(date, `after-${event.id}`)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            ここに予定を追加
                          </Button>
                        </div>

                        {/* イベント間の予定追加フォーム */}
                        {renderAddEventForm(date, `after-${event.id}`)}
                      </div>
                    ))}

                    {/* 最後のイベントの後に予定追加ボタン */}
                    {eventsOnDate.length > 0 && (
                      <div className="flex justify-center my-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 rounded-full text-xs text-muted-foreground"
                          onClick={() => handleAddEventClick(date, `end-of-day`)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          ここに予定を追加
                        </Button>
                      </div>
                    )}

                    {/* 日の終わりの予定追加フォーム */}
                    {renderAddEventForm(date, "end-of-day")}

                    {/* イベントがない場合 */}
                    {eventsOnDate.length === 0 && (
                      <div className="py-6 text-center text-muted-foreground">
                        <div className="mb-2">予定はありません</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {datesWithEvents.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">予定はありません</div>
            )}
          </div>
        </ScrollArea>

        {/* 新規予定追加ボタン */}
        <div className="p-4 bg-white border-t">
          <Button onClick={() => onAddEvent(new Date())} className="w-full bg-blue-500 hover:bg-blue-600">
            <Plus className="mr-2 h-4 w-4" />
            新しい予定を追加
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
