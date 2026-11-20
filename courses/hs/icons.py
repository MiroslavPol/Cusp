# Lesson icons for this course: lesson title -> icon spec (coordinates in [-1,1]^2, see app/js/path.js).
# Apply with:  python tools/insert_icons.py hs   (rewrites the "~ " line under each "### " lesson)
ICONS = {
# --- Středoškolské opakování
"Lineární rovnice": "f=0.7*x+0.2; pt=-0.286,0",
"Počítání s mocninami": "noaxes; text=xⁿ; size=0.9",
"Rozklad a kvadratické rovnice": "f=1.2*x^2-0.6; pt=-0.707,0; pt=0.707,0",
"Nerovnice": "f=0.6*x+0.1; shade=-1,1",
"Složená a inverzní funkce": "dash=-1,-1,1,1; f=exp(1.6*x)/2.5-0.8; f=ln(2.5*(x+0.8))/1.6",
"Co je funkce?": "noaxes; text=f(x); size=0.62",
"Lineární funkce": "f=0.6*x+0.15; f=-0.5*x-0.3",
"Kvadratická funkce": "f=0.6-1.4*(x-0.15)^2; pt=0.15,0.6",
"Exponenciální funkce": "f=exp(2*x)/4-0.7",
"Logaritmy": "f=0.35*ln(x+1.02)+0.2",
"Pravidla pro logaritmy": "noaxes; text=log; size=0.62",
"Pravoúhlý trojúhelník": "noaxes; poly=-0.8,-0.7,0.8,-0.7,-0.8,0.6,-0.8,-0.7; poly=-0.8,-0.45,-0.55,-0.45,-0.55,-0.7",
"Oblouková míra a jednotková kružnice": "circle=0,0,0.8; line=0,0,0.566,0.566; pt=0.566,0.566",
"Goniometrické vzorce": "f=0.6*sin(3*x); fd=0.6*cos(3*x)",
}
