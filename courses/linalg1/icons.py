# Lesson icons for this course: lesson title -> icon spec (coordinates in [-1,1]^2, see app/js/path.js).
# Apply with:  python tools/insert_icons.py linalg1   (rewrites the "~ " line under each "### " lesson)
ICONS = {
# --- Soustavy lineárních rovnic
"Soustava a její matice": "noaxes; text=(A|b); size=0.5",
"Gaussova eliminace": "noaxes; poly=-0.8,0.7,-0.3,0.7,-0.3,0.2,0.2,0.2,0.2,-0.3,0.7,-0.3,0.7,-0.8",
"Soustavy s parametrem": "f=0.5*x+0.35; f=0.5*x-0.35; fd=-0.9*x",
"Bonus: Přímky a roviny": "f=0.6*x+0.2; f=-0.7*x-0.1; pt=-0.231,0.062",
"Bonus: Komplexní čísla": "circle=0,0,0.7; arrow=0,0,0.5,0.49; pt=0.5,0.49",
# --- Počítání s maticemi
"Sčítání a násobení matic": "noaxes; text=AB; size=0.7",
"Vlastnosti násobení a transpozice": "noaxes; text=Aᵀ; size=0.75",
"Lineární modely": "f=0.25*exp(1.8*x)-0.6",
"Bonus: Matice jako zobrazení roviny": "noaxes; poly=-0.7,-0.6,0.2,-0.6,0.8,0.5,-0.1,0.5,-0.7,-0.6; arrow=-0.7,-0.6,0.2,-0.6; arrow=-0.7,-0.6,-0.1,0.5",
"Inverzní matice": "noaxes; text=A⁻¹; size=0.65",
"Výpočet inverzní matice": "noaxes; text=(A|E); size=0.5",
# --- Vektorové prostory
"Axiomy vektorového prostoru": "noaxes; arrow=-0.7,-0.6,0.3,-0.4; arrow=0.3,-0.4,0.6,0.5; arrow=-0.7,-0.6,0.6,0.5",
"Bonus: Tělesa a zbytkové třídy": "noaxes; text=ℤₚ; size=0.8",
"Podprostory": "f=0.7*x; pt=0,0",
"Lineární obal": "noaxes; poly=-0.7,-0.6,0.4,-0.3,0.8,0.6,-0.3,0.3,-0.7,-0.6; arrow=-0.7,-0.6,0.4,-0.3; arrow=-0.7,-0.6,-0.3,0.3",
# --- Lineární nezávislost a báze
"Lineární nezávislost": "noaxes; arrow=-0.6,-0.6,0.7,-0.3; arrow=-0.6,-0.6,-0.3,0.7",
"Báze": "noaxes; arrow=-0.6,-0.6,0.7,-0.6; arrow=-0.6,-0.6,-0.6,0.7",
"Výběr báze z generátorů": "noaxes; arrow=-0.6,-0.6,0.7,-0.3; arrow=-0.6,-0.6,-0.2,0.7; dash=-0.6,-0.6,0.5,0.4",
# --- Dimenze a souřadnice
"Steinitzova věta a dimenze": "noaxes; text=dim; size=0.6",
"Souřadnice": "noaxes; arrow=-0.7,-0.7,0.1,-0.3; arrow=-0.7,-0.7,-0.4,0.1; dash=0.1,-0.3,0.4,0.5; dash=-0.4,0.1,0.4,0.5; pt=0.4,0.5",
"Průnik a součet podprostorů": "f=0.6*x; f=-1.2*x; pt=0,0",
"Bonus: Fibonacci a prostory posloupností": "noaxes; text=Fₙ; size=0.8",
# --- Lineární zobrazení
"Lineární zobrazení": "noaxes; text=φ; size=0.9",
"Jádro a obraz": "noaxes; text=ker; size=0.6",
"Matice lineárního zobrazení": "noaxes; text=[φ]; size=0.65",
# --- Matice přechodu
"Skládání a inverze": "noaxes; text=ψ∘φ; size=0.6",
"Matice přechodu": "noaxes; arrow=-0.7,-0.7,0.6,-0.7; arrow=-0.7,-0.7,-0.7,0.6; arrow=-0.7,-0.7,0.4,-0.1; arrow=-0.7,-0.7,-0.2,0.5",
# --- Determinanty
"Determinant z vlastností": "noaxes; text=det; size=0.6",
"Počítání determinantů": "noaxes; text=|A|; size=0.7",
"Laplaceův rozvoj": "noaxes; text=±; size=0.9",
"Determinant součinu a inverze": "noaxes; text=|AB|; size=0.55",
"Bonus: Permutace a vzorec pro determinant": "noaxes; text=σ; size=0.9",
# --- Aplikace determinantu
"Cramerovo pravidlo": "noaxes; text=xᵢ; size=0.8",
"Orientace, obsah a objem": "noaxes; poly=-0.7,-0.6,0.3,-0.4,0.8,0.5,-0.2,0.3,-0.7,-0.6",
"Vektorový součin": "noaxes; arrow=-0.5,-0.5,0.7,-0.5; arrow=-0.5,-0.5,0.1,-0.1; arrow=-0.5,-0.5,-0.5,0.8",
# --- Hodnost a soustavy
"Hodnost matice": "noaxes; text=h(A); size=0.55",
"Věty o soustavách": "noaxes; text=Ax=b; size=0.45",
"Bonus: Afinní podprostory": "fd=0.5*x; f=0.5*x+0.5; pt=0,0",
"Bonus: Jak počítá tomograf": "noaxes; poly=-0.6,-0.6,0.6,-0.6,0.6,0.6,-0.6,0.6,-0.6,-0.6; line=-0.6,0,0.6,0; line=0,-0.6,0,0.6; arrow=-0.95,0.3,0.95,0.3",
# --- Opakování
"Důkazy z přednášky": "noaxes; text=∎; size=0.9",
"Zkouškové otázky": "noaxes; text=?; size=1",
}
