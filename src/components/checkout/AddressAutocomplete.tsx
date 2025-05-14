
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Nairobi locations to populate the autocomplete
const nairobiLocations = [
  "Westlands, Nairobi",
  "Kilimani, Nairobi",
  "Kileleshwa, Nairobi",
  "Lavington, Nairobi",
  "Karen, Nairobi",
  "Parklands, Nairobi",
  "Gigiri, Nairobi",
  "South B, Nairobi",
  "South C, Nairobi",
  "Eastleigh, Nairobi",
  "Umoja, Nairobi",
  "Kasarani, Nairobi",
  "Roysambu, Nairobi",
  "Kitisuru, Nairobi",
  "Runda, Nairobi",
  "Muthaiga, Nairobi",
  "Langata, Nairobi",
  "Embakasi, Nairobi",
  "Donholm, Nairobi",
  "Buruburu, Nairobi",
  "Ngara, Nairobi",
  "Pangani, Nairobi",
  "Huruma, Nairobi",
  "Kariobangi, Nairobi",
  "Pipeline, Nairobi",
  "Zimmerman, Nairobi",
  "CBD, Nairobi",
  "Ngong Road, Nairobi",
  "Hurlingham, Nairobi",
  "Dagoretti, Nairobi"
];

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function AddressAutocomplete({ value, onChange }: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Filter locations based on input
    if (newValue) {
      const filtered = nairobiLocations.filter(location => 
        location.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredLocations(filtered);
      if (filtered.length > 0 && !open) {
        setOpen(true);
      }
    } else {
      setFilteredLocations([]);
    }
  };

  const handleSelectLocation = (location: string) => {
    onChange(location);
    setOpen(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (value) {
      const filtered = nairobiLocations.filter(location => 
        location.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]);
    }
  }, [value]);

  return (
    <Popover open={open && filteredLocations.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            id="address"
            name="address"
            placeholder="Enter your delivery address in Nairobi"
            value={value}
            onChange={handleInputChange}
            className="w-full"
            required
            onClick={() => value && filteredLocations.length > 0 && setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search address..." className="h-9" value={value} onValueChange={onChange} />
          <CommandList>
            <CommandEmpty>No locations found.</CommandEmpty>
            <CommandGroup>
              {filteredLocations.map((location) => (
                <CommandItem
                  key={location}
                  value={location}
                  onSelect={() => handleSelectLocation(location)}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === location ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {location}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
