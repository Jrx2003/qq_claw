const images = [
  "/prototypes/01_group_chat_planning_friday_bbq_event.png",
  "/prototypes/03_weekend_bbq_confirmation_in_group_chat.png",
  "/prototypes/04_group_chat_memory_card_summary.png",
];

export function MemoryPhotoStrip() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((image, index) => (
        <div
          aria-label={`memory-${index + 1}`}
          className="h-16 rounded-xl border border-white/80 bg-cover bg-center shadow-sm"
          key={image}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
    </div>
  );
}
