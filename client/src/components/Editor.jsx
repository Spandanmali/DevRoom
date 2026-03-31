import React from "react";
import MonacoEditor from "@monaco-editor/react";

const Editor = ({
  value,
  onChange,
  language = "javascript",
  envLanguage = "javascript-node",
  theme = "vs-dark",
}) => {
  const handleEditorChange = (value, event) => {
    if (onChange) {
      onChange(value);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Determine whether we are in node or browser context
    const isNode = envLanguage === "javascript-node";

    // Configure Monaco closer to VS Code defaults for JS/TS
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      lib: isNode ? ["es2020"] : ["es2020", "dom"], // browser gets DOM, node gets just ES
    });

    if (isNode) {
      // Add fake basic Node types just to give autocomplete hints for require, module, process
      const nodeTypes = `
        declare var require: any;
        declare var module: { exports: any };
        declare var process: { env: any, cwd: () => string, exit: (code?: number) => void };
        declare var __dirname: string;
        declare var __filename: string;
        declare var global: any;
      `;
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        nodeTypes,
        "node.d.ts",
      );
    }

    // Make sure we only register them once per session
    if (!monaco.__customSnippetsRegistered) {
      monaco.__customSnippetsRegistered = true;

      const createSnippet = (
        label,
        insertText,
        kind = monaco.languages.CompletionItemKind.Snippet,
      ) => ({
        label,
        kind,
        insertText,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      });

      // HTML AUTOCOMPLETE
      monaco.languages.registerCompletionItemProvider("html", {
        provideCompletionItems: (model, position) => ({
          suggestions: [
            createSnippet(
              "html5",
              '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${2}\n</body>\n</html>',
            ),
            createSnippet("div", "<div>${1}</div>"),
            createSnippet("span", "<span>${1}</span>"),
            createSnippet("script", '<script src="${1}"></script>'),
            createSnippet(
              "link",
              '<link rel="stylesheet" href="${1:style.css}">',
            ),
            createSnippet("h1", "<h1>${1}</h1>"),
            createSnippet("p", "<p>${1}</p>"),
            createSnippet("img", '<img src="${1}" alt="${2}">'),
          ],
        }),
      });

      // CSS AUTOCOMPLETE
      monaco.languages.registerCompletionItemProvider("css", {
        provideCompletionItems: (model, position) => ({
          suggestions: [
            createSnippet(
              "flex",
              "display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};",
              monaco.languages.CompletionItemKind.Property,
            ),
            createSnippet(
              "grid",
              "display: grid;\ngrid-template-columns: ${1:repeat(3, 1fr)};\ngap: ${2:1rem};",
              monaco.languages.CompletionItemKind.Property,
            ),
            createSnippet(
              "margin",
              "margin: ${1:0} ${2:auto};",
              monaco.languages.CompletionItemKind.Property,
            ),
            createSnippet(
              "padding",
              "padding: ${1:1rem};",
              monaco.languages.CompletionItemKind.Property,
            ),
            createSnippet(
              "center",
              "display: flex;\njustify-content: center;\nalign-items: center;",
              monaco.languages.CompletionItemKind.Property,
            ),
            createSnippet(
              "font",
              "font-family: ${1:Arial, sans-serif};\nfont-size: ${2:16px};\nfont-weight: ${3:normal};",
              monaco.languages.CompletionItemKind.Property,
            ),
          ],
        }),
      });

      // PYTHON AUTOCOMPLETE
      monaco.languages.registerCompletionItemProvider("python", {
        provideCompletionItems: (model, position) => ({
          suggestions: [
            createSnippet(
              "def",
              "def ${1:name}(${2:args}):\n\t${3:pass}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "class",
              "class ${1:Name}:\n\tdef __init__(self):\n\t\t${2:pass}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "print",
              "print(${1})",
              monaco.languages.CompletionItemKind.Function,
            ),
            createSnippet(
              "if",
              "if ${1:condition}:\n\t${2:pass}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "elif",
              "elif ${1:condition}:\n\t${2:pass}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "else",
              "else:\n\t${1:pass}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "for",
              "for ${1:item} in ${2:iterable}:\n\t${3:pass}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "while",
              "while ${1:condition}:\n\t${2:pass}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "try",
              "try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}",
              monaco.languages.CompletionItemKind.Snippet,
            ),
            createSnippet(
              "import",
              "import ${1:module}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
          ],
        }),
      });

      // C++ AUTOCOMPLETE
      monaco.languages.registerCompletionItemProvider("cpp", {
        provideCompletionItems: (model, position) => ({
          suggestions: [
            createSnippet(
              "#include",
              "#include <${1:iostream}>",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "main",
              "int main() {\n\t${1}\n\treturn 0;\n}",
              monaco.languages.CompletionItemKind.Snippet,
            ),
            createSnippet(
              "cout",
              "std::cout << ${1} << std::endl;",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "cin",
              "std::cin >> ${1};",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "for",
              "for (int ${1:i} = 0; ${1:i} < ${2:count}; ${1:i}++) {\n\t${3}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "while",
              "while (${1:condition}) {\n\t${2}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "if",
              "if (${1:condition}) {\n\t${2}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "class",
              "class ${1:Name} {\npublic:\n\t${1:Name}();\n\t~${1:Name}();\nprivate:\n\t${2}\n};",
              monaco.languages.CompletionItemKind.Keyword,
            ),
          ],
        }),
      });

      // JAVA AUTOCOMPLETE
      monaco.languages.registerCompletionItemProvider("java", {
        provideCompletionItems: (model, position) => ({
          suggestions: [
            createSnippet(
              "sout",
              "System.out.println(${1});",
              monaco.languages.CompletionItemKind.Snippet,
            ),
            createSnippet(
              "main",
              "public static void main(String[] args) {\n\t${1}\n}",
              monaco.languages.CompletionItemKind.Snippet,
            ),
            createSnippet(
              "psvm",
              "public static void main(String[] args) {\n\t${1}\n}",
              monaco.languages.CompletionItemKind.Snippet,
            ),
            createSnippet(
              "class",
              "public class ${1:Name} {\n\t${2}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "for",
              "for (int ${1:i} = 0; ${1:i} < ${2:count}; ${1:i}++) {\n\t${3}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "if",
              "if (${1:condition}) {\n\t${2}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "public",
              "public ",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "private",
              "private ",
              monaco.languages.CompletionItemKind.Keyword,
            ),
          ],
        }),
      });

      // GO AUTOCOMPLETE
      monaco.languages.registerCompletionItemProvider("go", {
        provideCompletionItems: (model, position) => ({
          suggestions: [
            createSnippet(
              "main",
              "func main() {\n\t${1}\n}",
              monaco.languages.CompletionItemKind.Snippet,
            ),
            createSnippet(
              "fmt.Println",
              "fmt.Println(${1})",
              monaco.languages.CompletionItemKind.Function,
            ),
            createSnippet(
              "func",
              "func ${1:name}(${2:args}) ${3:type} {\n\t${4}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "type",
              "type ${1:Name} struct {\n\t${2}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "for",
              "for ${1:i} := 0; ${1:i} < ${2:count}; ${1:i}++ {\n\t${3}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "if",
              "if ${1:condition} {\n\t${2}\n}",
              monaco.languages.CompletionItemKind.Keyword,
            ),
            createSnippet(
              "err",
              "if err != nil {\n\treturn err\n}",
              monaco.languages.CompletionItemKind.Snippet,
            ),
          ],
        }),
      });
    }
  };

  return (
    <div className="w-full h-full min-h-[500px]">
      <MonacoEditor
        height="100%"
        width="100%"
        language={language}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true, scale: 0.75, renderCharacters: false },
          fontSize: 14,
          fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          wordWrap: "on",
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "smart",
          tabSize: 2,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          roundedSelection: false,
          scrollBeyondLastLine: false,
          folding: true,
          links: true,
          dragAndDrop: true,
          matchBrackets: "always",
          renderLineHighlight: "all",
          bracketPairColorization: {
            enabled: true,
            independentColorPoolPerBracketType: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
            highlightActiveIndentation: true,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
          snippetSuggestions: "inline",
          wordBasedSuggestions: "currentDocument",
          parameterHints: { enabled: true },
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          autoIndent: "full",
        }}
      />
    </div>
  );
};

export default Editor;
