const SkillsSection = ({ skills }) => {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Compétences</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors bg-secondary/50 hover:bg-secondary"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SkillsSection;