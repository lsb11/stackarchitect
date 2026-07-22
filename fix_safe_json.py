with open("src/utils/safeJson.ts", "r") as f:
    content = f.read()
content = content.replace("return jsonString", "return jsonString?")
content = content.replace(".replace(/&/g, '\\\\u0026');", ".replace(/&/g, '\\\\u0026') ?? '';")
with open("src/utils/safeJson.ts", "w") as f:
    f.write(content)
