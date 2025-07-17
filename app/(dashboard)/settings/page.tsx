"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  Filter,
  Download,
  Upload,
  Check,
  Globe,
  Smartphone,
  Share2,
  FileText,
  Phone,
  Mail,
  Truck,
  Hash,
  Braces,
  Copy
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { settingsApi, type Setting } from "@/lib/api"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const settingCategories = {
  app: { label: "تطبيق الموبايل", icon: Smartphone, color: "bg-blue-500" },
  social_media: { label: "وسائل التواصل الاجتماعي", icon: Share2, color: "bg-purple-500" },
  pages: { label: "الصفحات", icon: FileText, color: "bg-green-500" },
  contacts: { label: "معلومات الاتصال", icon: Phone, color: "bg-orange-500" },
  shipping: { label: "الشحن", icon: Truck, color: "bg-yellow-500" },
  general: { label: "عام", icon: Settings, color: "bg-gray-500" }
}

const typeIcons = {
  text: <Globe className="h-4 w-4" />,
  html: <FileText className="h-4 w-4" />,
  float: <Hash className="h-4 w-4" />,
  boolean: <Check className="h-4 w-4" />,
  json: <Braces className="h-4 w-4" />
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"key" | "updated_at" | "created_at">("key")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [editingSettings, setEditingSettings] = useState<{[key: number]: Setting}>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [selectedSettingsForBulk, setSelectedSettingsForBulk] = useState<number[]>([])
  
  const [newSetting, setNewSetting] = useState<Partial<Setting>>({
    key: "",
    value: "",
    type: "text",
    allow_null: false,
    is_setting: true
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await settingsApi.getAll({ per_page: 1000 })
      setSettings(response.data || [])
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("خطأ في تحميل الإعدادات")
    } finally {
      setLoading(false)
    }
  }

  const getCategoryFromKey = (key: string): string => {
    const parts = key.split('.')
    return parts[0] || 'general'
  }

  const filteredSettings = settings
    .filter(setting => {
      const matchesSearch = setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           setting.value.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || getCategoryFromKey(setting.key) === selectedCategory
      const matchesType = selectedType === "all" || setting.type === selectedType
      return matchesSearch && matchesCategory && matchesType
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case "updated_at":
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
        case "created_at":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case "key":
        default:
          aValue = a.key.toLowerCase()
          bValue = b.key.toLowerCase()
          break
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    const category = getCategoryFromKey(setting.key)
    if (!acc[category]) acc[category] = []
    acc[category].push(setting)
    return acc
  }, {} as Record<string, Setting[]>)

  const handleSingleEdit = async (id: number, value: string) => {
    try {
      await settingsApi.updateById(id, value)
      setSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s))
      toast.success("تم تحديث الإعداد بنجاح")
      setEditingSettings(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
    } catch (error) {
      console.error("Error updating setting:", error)
      toast.error("خطأ في تحديث الإعداد")
    }
  }

  const handleSingleEditByKey = async (key: string, value: string) => {
    try {
      await settingsApi.updateByKey(key, value)
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
      toast.success("تم تحديث الإعداد بنجاح")
    } catch (error) {
      console.error("Error updating setting by key:", error)
      toast.error("خطأ في تحديث الإعداد")
    }
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `settings_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("تم تصدير الإعدادات بنجاح")
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("تم نسخ النص إلى الحافظة")
    } catch (error) {
      toast.error("فشل في نسخ النص")
    }
  }

  const handleBulkEdit = async (bulkSettings: {key: string, value: string}[]) => {
    try {
      await settingsApi.bulkUpdate(bulkSettings)
      toast.success("تم تحديث الإعدادات بنجاح")
      fetchSettings()
      setIsBulkEditOpen(false)
      setSelectedSettingsForBulk([])
    } catch (error) {
      console.error("Error bulk updating settings:", error)
      toast.error("خطأ في تحديث الإعدادات")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعداد؟")) return

    try {
      await settingsApi.delete(id)
      setSettings(prev => prev.filter(s => s.id !== id))
      toast.success("تم حذف الإعداد بنجاح")
    } catch (error) {
      console.error("Error deleting setting:", error)
      toast.error("خطأ في حذف الإعداد")
    }
  }

  const handleAdd = async () => {
    if (!newSetting.key || !newSetting.value) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    try {
      const response = await settingsApi.create({
        key: newSetting.key,
        value: newSetting.value,
        type: newSetting.type || "text",
        allow_null: newSetting.allow_null || false,
        is_setting: newSetting.is_setting !== false
      })
      
      setSettings(prev => [response.data, ...prev])
      toast.success("تم إضافة الإعداد بنجاح")
      setIsAddDialogOpen(false)
      setNewSetting({
        key: "",
        value: "",
        type: "text",
        allow_null: false,
        is_setting: true
      })
    } catch (error) {
      console.error("Error adding setting:", error)
      toast.error("خطأ في إضافة الإعداد")
    }
  }

  const renderValueEditor = (setting: Setting, isEditing: boolean) => {
    const currentValue = editingSettings[setting.id]?.value ?? setting.value

    if (!isEditing) {
      if (setting.type === "html") {
        return (
          <div className="space-y-2">
            <div 
              className="prose prose-sm max-w-none text-sm text-gray-600"
              dangerouslySetInnerHTML={{ __html: currentValue.substring(0, 100) + (currentValue.length > 100 ? "..." : "") }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(currentValue)}
              className="h-6 text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              نسخ HTML
            </Button>
          </div>
        )
      }
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 line-clamp-2">
            {currentValue}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(currentValue)}
            className="h-6 text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            نسخ
          </Button>
        </div>
      )
    }

    if (setting.type === "html") {
      return (
        <div className="mt-2">
          <RichTextEditor
            value={currentValue}
            onChange={(value) => setEditingSettings(prev => ({
              ...prev,
              [setting.id]: { ...setting, value }
            }))}
          />
        </div>
      )
    }

    if (setting.type === "boolean") {
      return (
        <Switch
          checked={currentValue === "true" || currentValue === "1"}
          onCheckedChange={(checked) => setEditingSettings(prev => ({
            ...prev,
            [setting.id]: { ...setting, value: checked ? "true" : "false" }
          }))}
        />
      )
    }

    if (setting.type === "text" || setting.type === "float") {
      return (
        <Textarea
          value={currentValue}
          onChange={(e) => setEditingSettings(prev => ({
            ...prev,
            [setting.id]: { ...setting, value: e.target.value }
          }))}
          className="min-h-[80px]"
          placeholder={`أدخل ${setting.type === "float" ? "رقم" : "نص"}...`}
        />
      )
    }

    return (
      <Textarea
        value={currentValue}
        onChange={(e) => setEditingSettings(prev => ({
          ...prev,
          [setting.id]: { ...setting, value: e.target.value }
        }))}
        className="min-h-[100px] font-mono text-sm"
        placeholder="أدخل JSON..."
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">إدارة الإعدادات</h1>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* API Info Section */}
      {/* <Collapsible>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg text-white">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">معلومات API</h3>
                    <p className="text-sm text-gray-600">اضغط لعرض endpoints المتاحة للإعدادات</p>
                  </div>
                </div>
                <Badge variant="outline">انقر للتوسيع</Badge>
              </div>
            </CardContent>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-600">GET Endpoints</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-green-50 p-2 rounded border">
                      <code>GET /admin/settings</code>
                      <p className="text-gray-600 mt-1">جلب جميع الإعدادات</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded border">
                      <code>GET /admin/settings/{`{id}`}</code>
                      <p className="text-gray-600 mt-1">جلب إعداد بالمعرف</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded border">
                      <code>GET /admin/settings/{`{key}`}</code>
                      <p className="text-gray-600 mt-1">جلب إعداد بالمفتاح</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-600">POST/PUT Endpoints</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-blue-50 p-2 rounded border">
                      <code>POST /admin/settings</code>
                      <p className="text-gray-600 mt-1">إنشاء إعداد جديد</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded border">
                      <code>PUT /admin/settings/{`{id}`}</code>
                      <p className="text-gray-600 mt-1">تحديث إعداد بالمعرف</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded border">
                      <code>PUT /admin/settings</code>
                      <p className="text-gray-600 mt-1">تحديث جماعي للإعدادات</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded border">
                      <code>DELETE /admin/settings/{`{id}`}</code>
                      <p className="text-gray-600 mt-1">حذف إعداد</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <h4 className="font-medium">أمثلة على البيانات:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">للتعديل المفرد:</p>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "value": "10"
}`}
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">للتعديل الجماعي:</p>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "settings": [
    {
      "key": "test",
      "value": "TEST VALUE 2"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible> */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">إدارة الإعدادات</h1>
          <Badge variant="secondary">{settings.length} إعداد</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportSettings}
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير JSON
          </Button>
          
          <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                تعديل جماعي
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>التعديل الجماعي للإعدادات</DialogTitle>
                <DialogDescription>
                  يمكنك تعديل عدة إعدادات في نفس الوقت
                </DialogDescription>
              </DialogHeader>
              <BulkEditForm 
                settings={settings}
                onSave={handleBulkEdit}
                onCancel={() => setIsBulkEditOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                إضافة إعداد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة إعداد جديد</DialogTitle>
                <DialogDescription>
                  أضف إعداد جديد إلى النظام
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key">المفتاح</Label>
                  <Input
                    id="key"
                    value={newSetting.key || ""}
                    onChange={(e) => setNewSetting(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="مثال: app.version"
                  />
                </div>
                <div>
                  <Label htmlFor="type">النوع</Label>
                  <Select
                    value={newSetting.type || "text"}
                    onValueChange={(value) => setNewSetting(prev => ({ ...prev, type: value as Setting["type"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">نص</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="float">رقم عشري</SelectItem>
                      <SelectItem value="boolean">منطقي</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">القيمة</Label>
                  {newSetting.type === "html" ? (
                    <RichTextEditor
                      value={newSetting.value || ""}
                      onChange={(value) => setNewSetting(prev => ({ ...prev, value }))}
                    />
                  ) : (
                    <Textarea
                      id="value"
                      value={newSetting.value || ""}
                      onChange={(e) => setNewSetting(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="أدخل القيمة..."
                    />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow_null"
                    checked={newSetting.allow_null || false}
                    onCheckedChange={(checked) => setNewSetting(prev => ({ ...prev, allow_null: checked }))}
                  />
                  <Label htmlFor="allow_null">السماح بالقيم الفارغة</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAdd}>
                    إضافة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الإعدادات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Object.entries(settingCategories).map(([key, category]) => (
                  <SelectItem key={key} value={key}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="text">نص</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="float">رقم عشري</SelectItem>
                <SelectItem value="boolean">منطقي</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "key" | "updated_at" | "created_at")}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="key">المفتاح</SelectItem>
                <SelectItem value="updated_at">آخر تحديث</SelectItem>
                <SelectItem value="created_at">تاريخ الإنشاء</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="w-full md:w-auto"
            >
              {sortOrder === "asc" ? "تصاعدي ↑" : "تنازلي ↓"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings List */}
      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([categoryKey, categorySettings]) => {
          const category = settingCategories[categoryKey as keyof typeof settingCategories] || settingCategories.general
          
          return (
            <Card key={categoryKey} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg text-white", category.color)}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.label}</CardTitle>
                    <CardDescription>
                      {categorySettings.length} إعداد في هذه الفئة
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {categorySettings.map((setting) => {
                    const isEditing = setting.id in editingSettings
                    
                    return (
                      <motion.div
                        key={setting.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "border rounded-lg p-4 transition-all duration-200",
                          isEditing ? "border-blue-300 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                {setting.key}
                              </code>
                              <Badge variant={setting.type === "html" ? "default" : "secondary"}>
                                {setting.type}
                              </Badge>
                              {!setting.allow_null && (
                                <Badge variant="destructive">مطلوب</Badge>
                              )}
                            </div>
                            
                            <div className="mt-2">
                              {renderValueEditor(setting, isEditing)}
                            </div>
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <span>آخر تحديث: {new Date(setting.updated_at).toLocaleDateString("ar")}</span>
                              <span>إنشئ في: {new Date(setting.created_at).toLocaleDateString("ar")}</span>
                              <span>ID: {setting.id}</span>
                              {setting.allow_null && (
                                <Badge variant="outline" className="text-xs">يقبل null</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSingleEdit(setting.id, editingSettings[setting.id].value)}
                                  className="h-8"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingSettings(prev => {
                                    const updated = { ...prev }
                                    delete updated[setting.id]
                                    return updated
                                  })}
                                  className="h-8"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingSettings(prev => ({
                                    ...prev,
                                    [setting.id]: { ...setting }
                                  }))}
                                  className="h-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(setting.id)}
                                  className="h-8 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredSettings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد إعدادات</h3>
            <p className="text-gray-500 text-center">
              {searchTerm || selectedCategory !== "all" || selectedType !== "all"
                ? "لا توجد إعدادات تطابق معايير البحث"
                : "لم يتم العثور على أي إعدادات"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Bulk Edit Component
function BulkEditForm({ 
  settings, 
  onSave, 
  onCancel 
}: { 
  settings: Setting[]
  onSave: (settings: {key: string, value: string}[]) => void
  onCancel: () => void
}) {
  const [bulkSettings, setBulkSettings] = useState<{key: string, value: string}[]>([
    { key: "", value: "" }
  ])

  const addSetting = () => {
    setBulkSettings(prev => [...prev, { key: "", value: "" }])
  }

  const removeSetting = (index: number) => {
    setBulkSettings(prev => prev.filter((_, i) => i !== index))
  }

  const updateSetting = (index: number, field: "key" | "value", value: string) => {
    setBulkSettings(prev => prev.map((setting, i) => 
      i === index ? { ...setting, [field]: value } : setting
    ))
  }

  const handleSave = () => {
    const validSettings = bulkSettings.filter(s => s.key && s.value)
    if (validSettings.length === 0) {
      toast.error("يرجى إضافة إعداد واحد على الأقل")
      return
    }
    onSave(validSettings)
  }

  return (
    <div className="space-y-4">
      <div className="max-h-96 overflow-y-auto space-y-3">
        {bulkSettings.map((setting, index) => (
          <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
            <div className="flex-1">
              <Label className="text-xs">المفتاح</Label>
              <Select
                value={setting.key}
                onValueChange={(value) => updateSetting(index, "key", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الإعداد" />
                </SelectTrigger>
                <SelectContent>
                  {settings.map((s) => (
                    <SelectItem key={s.id} value={s.key}>
                      {s.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">القيمة الجديدة</Label>
              <Input
                value={setting.value}
                onChange={(e) => updateSetting(index, "value", e.target.value)}
                placeholder="أدخل القيمة الجديدة"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => removeSetting(index)}
              className="mt-5 h-9"
              disabled={bulkSettings.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={addSetting}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة إعداد آخر
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button onClick={handleSave}>
            حفظ التغييرات
          </Button>
        </div>
      </div>
    </div>
  )
}
