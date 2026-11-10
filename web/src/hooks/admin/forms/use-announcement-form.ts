import { useSaveAnnouncement } from "@/hooks/admin/use-announcement";
import { ANNOUNCEMENT_LIMIT, type IAnnouncement } from "@/services/admin/announcement";
import { PROFILE_TITLE_LIMIT } from "@/utils/admin/announcement/profile/title";
import { useForm, useWatch } from "react-hook-form";

export function useAnnouncementForm(initial: IAnnouncement) {
  const form = useForm<IAnnouncement>({
    defaultValues: {
      ...initial,
      profileTitle: initial.profileTitle ?? "",
      defaultUserFlag: initial.defaultUserFlag ?? "",
    },
  });
  const [text, title, isEnabled] = useWatch({
    control: form.control,
    name: ["text", "profileTitle", "enabled"],
  });
  const count = Array.from(text).length;
  const titleCount = Array.from(title ?? "").length;
  const save = useSaveAnnouncement();
  return {
    form,
    count,
    isEnabled,
    isPending: save.isPending,
    isTooLong: count > ANNOUNCEMENT_LIMIT || titleCount > PROFILE_TITLE_LIMIT,
    onSubmit: (value: IAnnouncement) => save.mutate(value),
  };
}
