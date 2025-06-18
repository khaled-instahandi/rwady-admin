"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  ImageIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Quote,
  Undo,
  Redo,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [content, setContent] = useState(value || "")
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current) {
      // Always update the innerHTML when value changes to ensure synchronization
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      setContent(newContent)
      onChange(newContent)
    }
  }

  const toolbarButtons = [
    { icon: Bold, command: "bold", title: "Bold (Ctrl+B)" },
    { icon: Italic, command: "italic", title: "Italic (Ctrl+I)" },
    { icon: Underline, command: "underline", title: "Underline (Ctrl+U)" },
    { icon: Strikethrough, command: "strikethrough", title: "Strikethrough" },
    null, // separator
    { icon: Link, command: "createLink", title: "Insert Link", prompt: "Enter the URL:" },
    { icon: ImageIcon, command: "insertImage", title: "Insert Image", prompt: "Enter the image URL:" },
    null, // separator
    { icon: List, command: "insertUnorderedList", title: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", title: "Numbered List" },
    null, // separator
    { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", title: "Align Center" },
    { icon: AlignRight, command: "justifyRight", title: "Align Right" },
    null, // separator
    { icon: Code, command: "formatBlock", title: "Code Block", value: "<pre>" },
    { icon: Quote, command: "formatBlock", title: "Quote", value: "<blockquote>" },
    null, // separator
    { icon: Undo, command: "undo", title: "Undo (Ctrl+Z)" },
    { icon: Redo, command: "redo", title: "Redo (Ctrl+Y)" },
  ]

  const executeCommand = (command: string, value?: string) => {
    if (command === "createLink" || command === "insertImage") {
      const url = prompt(value)
      if (url) {
        document.execCommand(command, false, url)
      }
    } else if (value) {
      document.execCommand(command, false, value)
    } else {
      document.execCommand(command, false)
    }
    handleContentChange()
  }

  return (
    <div
      className={`border border-gray-300 rounded-md overflow-hidden transition-all duration-200 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${className}`}
    >
      {/* Toolbar */}
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
          {toolbarButtons.map((button, index) => {
            if (button === null) {
              return <div key={index} className="w-px h-8 bg-gray-200 mx-1" />
            }

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => executeCommand(button.command, button.prompt || button.value)}
                    className="h-8 w-8 p-0 hover:bg-gray-200 hover:text-blue-600 transition-colors"
                  >
                    <button.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{button.title}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-4 focus:outline-none transition-colors"
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={handleContentChange}
        style={{ whiteSpace: "pre-wrap" }}
        data-placeholder={placeholder}
        onFocus={(e) => e.currentTarget.classList.add("bg-blue-50")}
        onBlur={(e) => e.currentTarget.classList.remove("bg-blue-50")}
      />
    </div>
  )
}
