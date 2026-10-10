"use client";

import { useId } from "react";
import {
  type Level,
  LEVELS,
  type NailForm,
  presetOf,
} from "@/components/nail-form";
import type { DesignerCopy } from "@/content/dictionary";
import { fill } from "@/content/dictionary";

// Length, shape and sharpness as native range inputs on a rose track with
// five tick dots and the preset name under the thumb.

type Field = keyof NailForm;

interface LevelSliderProperties {
  field: Field;
  value: Level;
  form: NailForm;
  copy: DesignerCopy;
  onChange: (field: Field, value: Level) => void;
}

const toLevel = (value: string): Level => {
  const number = Number(value);

  return LEVELS.find((level) => level === number) ?? 3;
};

const LevelSlider = ({
  field,
  value,
  form,
  copy,
  onChange,
}: Readonly<LevelSliderProperties>) => {
  const id = useId();
  const preset = copy.presets[presetOf({ ...form, [field]: value })];
  const name =
    field === "length" ? `${copy.export.length} ${String(value)}` : preset;
  const valueText = fill(copy.levelText, { value, name });

  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-burgundy">
          {copy.panels[field]}
        </label>
        <output htmlFor={id} className="text-xs text-plum">
          {name}
        </output>
      </div>
      <div className="relative mt-3 h-11">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[0.7rem] top-1/2 flex -translate-y-1/2 justify-between"
        >
          {LEVELS.map((level) => (
            <span
              key={level}
              className={`size-1.5 rounded-full ${level <= value ? "bg-rose" : "bg-rose/40"}`}
            />
          ))}
        </div>
        <input
          id={id}
          type="range"
          min="1"
          max="5"
          step="1"
          value={value}
          aria-valuetext={valueText}
          onChange={(event) => {
            onChange(field, toLevel(event.target.value));
          }}
          className="level-slider absolute inset-0 w-full"
        />
      </div>
    </div>
  );
};

const FormSliders = ({
  form,
  copy,
  fields = ["length", "shape", "sharpness"],
  onChange,
}: Readonly<{
  form: NailForm;
  copy: DesignerCopy;
  fields?: readonly Field[];
  onChange: (field: Field, value: Level) => void;
}>) => (
  <div>
    {fields.map((field) => (
      <LevelSlider
        key={field}
        field={field}
        value={form[field]}
        form={form}
        copy={copy}
        onChange={onChange}
      />
    ))}
  </div>
);

export { FormSliders, LevelSlider };

export type { Field };
