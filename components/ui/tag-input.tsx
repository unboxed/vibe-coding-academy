"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { COMMON_TECH_STACKS } from "@/types/database"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: readonly string[]
  placeholder?: string
  maxTags?: number
  disabled?: boolean
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  suggestions = COMMON_TECH_STACKS,
  placeholder = "Add tech stack...",
  maxTags = 10,
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !value.includes(s) &&
      s.toLowerCase().includes(inputValue.toLowerCase())
  )

  const canAddMore = value.length < maxTags

  const addTag = React.useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim()
      if (trimmedTag && !value.includes(trimmedTag) && canAddMore) {
        onChange([...value, trimmedTag])
        setInputValue("")
        setShowSuggestions(false)
      }
    },
    [value, onChange, canAddMore]
  )

  const removeTag = React.useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove))
    },
    [value, onChange]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        if (inputValue.trim()) {
          addTag(inputValue)
        }
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1])
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
      }
    },
    [inputValue, value, addTag, removeTag]
  )

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input with suggestions dropdown */}
      {canAddMore && !disabled && (
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && (inputValue || filteredSuggestions.length > 0) && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
              {filteredSuggestions.length > 0 ? (
                <>
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Suggestions
                  </p>
                  {filteredSuggestions.slice(0, 8).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => addTag(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </>
              ) : inputValue.trim() ? (
                <button
                  type="button"
                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => addTag(inputValue)}
                >
                  Add &quot;{inputValue.trim()}&quot;
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-muted-foreground">
        {value.length} of {maxTags} tags
      </p>
    </div>
  )
}
