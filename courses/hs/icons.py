# Lesson icons for this course: lesson title -> icon spec (coordinates in [-1,1]^2, see app/js/path.js).
# Apply with:  python tools/insert_icons.py hs   (rewrites the "~ " line under each "### " lesson)
ICONS = {
# --- Výroky a množiny
"Výroky a jejich negace": "noaxes; text=¬A; size=0.85",
"Implikace a kvantifikátory": "noaxes; text=∀∃; size=0.85",
"Množiny a intervaly": "noaxes; circle=-0.32,0,0.55; circle=0.32,0,0.55",
# --- Rovnice a nerovnice
"Lineární rovnice": "f=0.7*x+0.2; pt=-0.286,0",
"Rozklad a kvadratické rovnice": "f=1.2*x^2-0.6; pt=-0.707,0; pt=0.707,0",
"Kvadratický trojčlen a Viètovy vzorce": "f=1.1*(x-0.1)^2-0.6; pt=-0.64,0; pt=0.84,0; dash=0.1,-0.9,0.1,0.9",
"Nerovnice": "f=0.6*x+0.1; shade=-1,1",
"Nerovnice v součinovém a podílovém tvaru": "f=1.5*(x+0.5)*(x-0.5); shade=-0.5,0.5",
# --- Další rovnice a soustavy
"Absolutní hodnota": "f=1.3*abs(x)-0.6",
"Odmocniny a neznámá ve jmenovateli": "f=0.9*sqrt(x+1)-0.6; f=0.3-0.5*x",
"Soustavy rovnic": "f=0.8*x+0.1; f=-0.6*x+0.3; pt=0.143,0.214",
"Slovní úlohy": "noaxes; text=%; size=1.1",
"Rovnice s parametrem": "f=1.2*x^2-0.7; f=1.2*x^2-0.2; f=1.2*x^2+0.3",
# --- Funkce
"Co je funkce?": "noaxes; text=f(x); size=0.62",
"Vlastnosti funkcí": "f=0.9*x^3; fd=x^2-0.5",
"Lineární funkce": "f=0.6*x+0.15; f=-0.5*x-0.3",
"Kvadratická funkce": "f=0.6-1.4*(x-0.15)^2; pt=0.15,0.6",
"Posouvání a překlápění grafů": "fd=1.2*x^2-0.7; f=1.2*(x-0.4)^2-0.2",
"Složená a inverzní funkce": "dash=-1,-1,1,1; f=exp(1.6*x)/2.5-0.8; f=ln(2.5*(x+0.8))/1.6",
# --- Mocniny a odmocniny
"Počítání s mocninami": "noaxes; text=xⁿ; size=0.9",
"Odmocniny a usměrňování": "noaxes; text=√2; size=0.9",
"Mocninné funkce": "f=x^2*0.9; f=x^3*0.9; f=x^4*0.9",
"Lineární lomená funkce": "f=0.15/x",
# --- Exponenciály a logaritmy
"Exponenciální funkce": "f=exp(2*x)/4-0.7",
"Logaritmy": "f=0.35*ln(x+1.02)+0.2",
"Pravidla pro logaritmy": "noaxes; text=log; size=0.62",
"Exponenciální a logaritmické rovnice": "f=exp(2*x)/4-0.7; dash=-1,0.3,1,0.3; pt=0.693,0.3",
"Exponenciální a logaritmické nerovnice": "f=exp(2*x)/4-0.7; dash=-1,0.3,1,0.3; band=-1,0.3",
# --- Goniometrie
"Pravoúhlý trojúhelník": "noaxes; poly=-0.8,-0.7,0.8,-0.7,-0.8,0.6,-0.8,-0.7; poly=-0.8,-0.45,-0.55,-0.45,-0.55,-0.7",
"Oblouková míra a jednotková kružnice": "circle=0,0,0.8; line=0,0,0.566,0.566; pt=0.566,0.566",
"Grafy goniometrických funkcí": "f=0.7*sin(4*x); fd=0.7*cos(4*x)",
"Goniometrické vzorce": "f=0.6*sin(3*x); fd=0.6*cos(3*x)",
"Goniometrické rovnice a nerovnice": "circle=0,0,0.8; dash=-1,0.4,1,0.4; pt=0.693,0.4; pt=-0.693,0.4",
"Sinová a kosinová věta": "noaxes; poly=-0.85,-0.6,0.85,-0.6,-0.25,0.7,-0.85,-0.6",
# --- Posloupnosti a řady
"Posloupnosti a jejich vlastnosti": "seq=0.7-1.3/n; N=8; dash=-1.1,0.7,1.1,0.7",
"Aritmetická posloupnost": "seq=-0.85+0.22*n; N=8",
"Geometrická posloupnost": "seq=-0.9+0.025*2^n; N=8",
"Nekonečná geometrická řada": "noaxes; poly=-0.8,-0.8,0.8,-0.8,0.8,0.8,-0.8,0.8,-0.8,-0.8; line=0,-0.8,0,0.8; line=0,0,0.8,0; line=0.4,0,0.4,0.8",
# --- Planimetrie
"Úhly a trojúhelníky": "noaxes; line=-1,-0.4,1,-0.4; line=-1,0.4,1,0.4; line=-0.5,-0.9,0.5,0.9",
"Podobnost a Euklidovy věty": "noaxes; poly=-0.9,-0.7,0.9,-0.7,0.25,0.55,-0.9,-0.7; line=0.25,-0.7,0.25,0.55",
"Kružnice a úhly": "noaxes; circle=0,0,0.8; poly=-0.8,0,0.8,0,0.3,0.74,-0.8,0",
"Shodná zobrazení a množiny bodů": "noaxes; dash=0,-1,0,1; poly=-0.85,-0.5,-0.25,-0.5,-0.55,0.4,-0.85,-0.5; poly=0.85,-0.5,0.25,-0.5,0.55,0.4,0.85,-0.5",
# --- Stereometrie
"Polohové vztahy v krychli": "noaxes; poly=-0.7,-0.75,0.4,-0.75,0.4,0.35,-0.7,0.35,-0.7,-0.75; poly=-0.7,0.35,-0.35,0.75,0.75,0.75,0.4,0.35; line=0.75,0.75,0.75,-0.35; line=0.75,-0.35,0.4,-0.75",
"Vzdálenosti a odchylky": "noaxes; poly=-0.7,-0.75,0.4,-0.75,0.4,0.35,-0.7,0.35,-0.7,-0.75; poly=-0.7,0.35,-0.35,0.75,0.75,0.75,0.4,0.35; line=0.75,0.75,0.75,-0.35; line=0.75,-0.35,0.4,-0.75; line=-0.7,-0.75,0.75,0.75",
"Objemy a povrchy těles": "noaxes; ell=0,-0.6,0.6,0.18; ell=0,0.6,0.6,0.18; line=-0.6,-0.6,-0.6,0.6; line=0.6,-0.6,0.6,0.6",
# --- Vektory a analytická geometrie
"Vektory": "arrow=-0.8,-0.6,0.3,0.1; arrow=0.3,0.1,0.6,0.8; arrow=-0.8,-0.6,0.6,0.8",
"Skalární a vektorový součin": "arrow=-0.7,-0.6,0.8,-0.1; arrow=-0.7,-0.6,-0.3,0.8",
"Přímka v rovině": "f=0.6*x+0.1; arrow=-0.5,-0.2,0.1,0.16",
"Vzdálenosti a vzájemná poloha": "f=0.5*x-0.3; pt=-0.3,0.7; line=-0.3,0.7,0.12,-0.24",
"Přímky a roviny v prostoru": "noaxes; poly=-0.9,-0.5,0.3,-0.8,0.9,0.1,-0.3,0.4,-0.9,-0.5; line=0,-1,0.1,0.9",
# --- Kuželosečky
"Kružnice": "circle=0.1,0.05,0.65; pt=0.1,0.05",
"Elipsa": "ell=0,0,0.85,0.5; pt=-0.69,0; pt=0.69,0",
"Hyperbola a parabola": "f=x^2*0.9-0.6; fd=0.15/x",
"Kuželosečka a přímka": "circle=0,0,0.6; f=0.4*x+0.2; f=0.6",
# --- Komplexní čísla
"Algebraický tvar": "noaxes; text=i²; size=1",
"Gaussova rovina": "arrow=0,0,0.6,0.7; pt=0.6,0.7; dash=0.6,0,0.6,0.7",
"Goniometrický tvar a Moivreova věta": "circle=0,0,0.75; arrow=0,0,0.53,0.53; pt=0.75,0; pt=-0.375,0.65; pt=-0.375,-0.65",
"Rovnice v komplexních číslech": "noaxes; circle=0,0,0.75; pt=0.75,0; pt=0,0.75; pt=-0.75,0; pt=0,-0.75",
# --- Kombinatorika
"Faktoriál a kombinační čísla": "noaxes; text=n!; size=0.95",
"Variace, permutace a kombinace": "noaxes; line=-0.8,0,0,0.6; line=-0.8,0,0,-0.6; line=0,0.6,0.8,0.85; line=0,0.6,0.8,0.35; line=0,-0.6,0.8,-0.35; line=0,-0.6,0.8,-0.85; pt=-0.8,0",
"Binomická věta a indukce": "noaxes; text=(a+b)ⁿ; size=0.5",
# --- Pravděpodobnost a statistika
"Pravděpodobnost": "noaxes; text=⚄; size=1.1",
"Nezávislé jevy a opakované pokusy": "f=0.9*exp(-3*(x+0.1)^2)-0.1; rect=-0.9,0.9,6",
"Statistika": "noaxes; bar=-0.75,-0.8,-0.75,-0.1; bar=-0.3,-0.8,-0.3,0.6; bar=0.15,-0.8,0.15,0.3; bar=0.6,-0.8,0.6,-0.3",
# --- Úvod do analýzy
"Limita funkce": "f=0.6*x+0.1; hole=0.3,0.28",
"Derivace a tečna": "f=0.9*x^2-0.5; tan=0.4",
"Integrál a obsah": "f=0.5+0.3*sin(3*x); shade=-0.6,0.6",
}
