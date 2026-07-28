import { AppButton } from "@/shared/ui/components/button";
import { AppHeading } from "@/shared/ui/components/heading";
import {
  atomControlHeights,
  atomControlRadius,
  atomPalette,
  atomSpacing
} from "@/shared/ui/components/theme";
import { AppText } from "@/shared/ui/components/text";
import { FormField } from "@/shared/ui/forms";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@/shared/ui/icons";
import { formatDateOnly } from "@/shared/utils/date-only";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ViewStyle
} from "react-native";

const calendarWeekdayLabels = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat"
];
const calendarMonthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export function ProjectFormCalendarField({
  errorText,
  label,
  onChange,
  value
}: {
  errorText?: string | null;
  label: string;
  onChange: (date: string) => void;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getCalendarMonth(value)
  );
  const selectedDate = parseCalendarDate(value);
  const calendarDays = getCalendarDays(visibleMonth);

  useEffect(() => {
    if (isOpen) {
      setVisibleMonth(getCalendarMonth(value));
    }
  }, [isOpen, value]);

  const selectDate = (date: Date) => {
    onChange(toCalendarDateValue(date));
    setIsOpen(false);
  };

  return (
    <FormField errorText={errorText} label={label}>
      <Pressable
        accessibilityLabel={`${label} date picker`}
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={StyleSheet.flatten([
          styles.datePickerButton,
          errorText ? styles.datePickerButtonError : null,
          Platform.OS === "web" ? styles.webCursor : null
        ])}
      >
        <CalendarIcon
          color={value ? atomPalette.text : atomPalette.textMuted}
          size={18}
        />
        <AppText tone={value ? "default" : "subtle"} variant="body">
          {formatDateOnly(value, { fallback: "Select date" })}
        </AppText>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <View style={styles.calendarBackdrop}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <CalendarIconButton
                accessibilityLabel="Previous month"
                icon={ChevronLeftIcon}
                onPress={() =>
                  setVisibleMonth(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() - 1, 1)
                  )
                }
              />
              <AppHeading variant="section">
                {formatCalendarMonth(visibleMonth)}
              </AppHeading>
              <CalendarIconButton
                accessibilityLabel="Next month"
                icon={ChevronRightIcon}
                onPress={() =>
                  setVisibleMonth(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() + 1, 1)
                  )
                }
              />
            </View>

            <View style={styles.calendarWeekdays}>
              {calendarWeekdayLabels.map((weekday) => (
                <Text key={weekday} style={styles.calendarWeekday}>
                  {weekday}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day) => {
                const isSelected =
                  selectedDate &&
                  toCalendarDateValue(selectedDate) ===
                    toCalendarDateValue(day.date);

                return (
                  <Pressable
                    accessibilityLabel={`Select ${formatDateOnly(
                      toCalendarDateValue(day.date)
                    )}`}
                    accessibilityRole="button"
                    key={day.key}
                    onPress={() => selectDate(day.date)}
                    style={StyleSheet.flatten([
                      styles.calendarDay,
                      day.isCurrentMonth ? null : styles.calendarDayOutside,
                      isSelected ? styles.calendarDaySelected : null,
                      Platform.OS === "web" ? styles.webCursor : null
                    ])}
                  >
                    <Text
                      style={StyleSheet.flatten([
                        styles.calendarDayText,
                        day.isCurrentMonth
                          ? null
                          : styles.calendarDayTextOutside,
                        isSelected ? styles.calendarDayTextSelected : null
                      ])}
                    >
                      {day.date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <AppButton
                color="neutral"
                fullWidth={false}
                onPress={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                size="sm"
                variant="bordered"
              >
                Clear
              </AppButton>
              <AppButton
                fullWidth={false}
                onPress={() => setIsOpen(false)}
                size="sm"
              >
                Done
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>
    </FormField>
  );
}

function CalendarIconButton({
  accessibilityLabel,
  icon: Icon,
  onPress
}: {
  accessibilityLabel: string;
  icon: typeof ChevronLeftIcon;
  onPress: (event: GestureResponderEvent) => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={StyleSheet.flatten([
        styles.calendarIconButton,
        Platform.OS === "web" ? styles.webCursor : null
      ])}
    >
      <Icon color={atomPalette.text} size={20} />
    </Pressable>
  );
}

function getCalendarMonth(value: string) {
  const parsed = parseCalendarDate(value);
  const today = new Date();
  const source = parsed ?? today;

  return new Date(source.getFullYear(), source.getMonth(), 1);
}

function getCalendarDays(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const days: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];

  for (let offset = 0; offset < 42; offset += 1) {
    const date = new Date(year, month, offset - firstWeekday + 1);

    days.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      key: toCalendarDateValue(date)
    });
  }

  return days;
}

function parseCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatCalendarMonth(date: Date) {
  return `${calendarMonthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

function toCalendarDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  calendarActions: {
    flexDirection: "row",
    gap: atomSpacing[3],
    justifyContent: "flex-end"
  },
  calendarBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(18, 18, 18, 0.28)",
    flex: 1,
    justifyContent: "center",
    padding: atomSpacing[5]
  },
  calendarDay: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 999,
    justifyContent: "center",
    width: `${100 / 7}%`
  },
  calendarDayOutside: {
    opacity: 0.42
  },
  calendarDaySelected: {
    backgroundColor: atomPalette.accent
  },
  calendarDayText: {
    color: atomPalette.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18
  },
  calendarDayTextOutside: {
    color: atomPalette.textMuted
  },
  calendarDayTextSelected: {
    color: atomPalette.accentText
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  calendarIconButton: {
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    borderColor: atomPalette.borderSubtle,
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  calendarModal: {
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: atomSpacing[5],
    maxWidth: 360,
    padding: atomSpacing[5],
    width: "100%"
  },
  calendarWeekday: {
    color: atomPalette.textMuted,
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
    textTransform: "uppercase"
  },
  calendarWeekdays: {
    flexDirection: "row"
  },
  datePickerButton: {
    alignItems: "center",
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border,
    borderRadius: atomControlRadius,
    borderWidth: 1,
    flexDirection: "row",
    gap: atomSpacing[3],
    minHeight: atomControlHeights.lg,
    paddingHorizontal: atomSpacing[4]
  },
  datePickerButtonError: {
    borderColor: atomPalette.error
  },
  webCursor: {
    cursor: "pointer"
  } as ViewStyle
});
