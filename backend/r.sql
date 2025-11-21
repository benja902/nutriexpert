INSERT INTO rules (id, name, priority, json)
VALUES (
  'R_VEG',
  'Vegetariano',
  5,
  '{"id":"R_VEG","name":"Vegetariano","priority":5,"when":[{"fact":"diet_preference","op":"=","value":"vegetarian"}],"then":{"diagnosis":["Preferencia: Vegetariano"],"diet":{"advice":["Asegurar ingesta de B12, hierro, zinc y omega-3 (algas, semillas).","Combinar cereales + legumbres para proteína completa."],"restrictions":["carne","pescado"]},"explain":"Preferencia alimentaria que requiere planificación para evitar deficiencias."}}'
);