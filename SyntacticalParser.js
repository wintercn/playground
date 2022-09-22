void function (){
    var rules = 
    {
        "Expression":[["(","Expression", ")"],["NumericLiteral"], ["Identifier"], ["Function"], ["Expression", "(", "Expression", ")"]], 
        "Function":[["Identifier", "=>", "Expression"]],
        "Statement":[["Expression", ";"], ["const", "Identifier", "=", "Expression", ";"]], 
        "Program":[["SourceElements"]], 
        "SourceElements":[["Statement"], ["SourceElements", "Statement"]], "SourceElement":[["Statement"], ["FunctionDeclaration"]]
    };
    function Symbol(symbolName, token)
    {
        this.name = symbolName;
        this.token = token;
        this.childNodes = [];
        this.toString = 
            function(indent)
            {
                if(!indent)
                    indent = "";
                if(this.childNodes.length == 1)
                    return this.childNodes[0]. toString (indent);
                var str = indent + this.name + (this.token != undefined && this.name != this.token ? ":" + this.token:"") + "\n";
                for(var i = 0;i < this.childNodes.length;i++)
                    str += this.childNodes[i]. toString (indent + "    ");
                return str;
            };
    }
    function SyntacticalParser()
    {
        var currentRule;
        var root = {
            Program:"$"
        };
        var hash = {};
        function visitNode(node)
        {
            hash[JSON.stringify(node)] = node;
            node.$closure = true;
            var queue = Object.getOwnPropertyNames(node);
            while(queue.length)
            {
                var symbolName = queue.shift();
                if(!rules[symbolName])
                    continue;
                rules[symbolName].forEach(
                    function(rule)
                    {
                        if(node[symbolName].$lookahead && node[symbolName].$lookahead.some(
                            function(e)
                            {
                                return e == rule[0];
                            }))
                            return;
                        if(!node[rule[0]])
                            queue.push(rule[0]);
                        var rulenode = node;
                        var lastnode = null;
                        rule.forEach(
                            function(symbol)
                            {
                                if(!rulenode[symbol])
                                    rulenode[symbol] = {};
                                lastnode = rulenode;
                                rulenode = rulenode[symbol];
                            });
                        if(node[symbolName].$lookahead)
                            node[rule[0]].$lookahead = node[symbolName].$lookahead;
                        if(node[symbolName].$div)
                            rulenode.$div = true;
                        rulenode.$reduce = symbolName;
                        rulenode.$count = rule.filter(function(e) {
                            return!e.match(/\[([^\]]+)\]/);
                        }).length;
                    });
            }
            for(var p in node)
            {
                if(typeof node[p] != "object" || p.charAt(0) == "$" || node[p].$closure)
                    continue;
                if(hash[JSON.stringify(node[p])])
                    node[p] = hash[JSON.stringify(node[p])];
                else
                {
                    visitNode(node[p]);
                }
            }
        }
        visitNode(root);
        var symbolStack = [];
        var statusStack = [root];
        var current = root;
        this.insertSymbol = 
            function insertSymbol(symbol, haveLineTerminator = false)
            {
                while(!current[symbol.name] && current["$reduce"])
                {
                    var count = current["$count"];
                    var newsymbol = new Symbol(current["$reduce"]);
                    while(count--)
                        newsymbol.childNodes.push(symbolStack.pop()), statusStack.pop();
                    current = statusStack[statusStack.length - 1];
                    this.insertSymbol(newsymbol);
                }
                if(!current[symbol.name] && current[";"] && current[";"]["$reduce"] && current[";"]["$reduce"] != "EmptyStatement" && (haveLineTerminator || symbol.name == "}"))
                {
                    this.insertSymbol(new Symbol(";", ";"));
                    return this.insertSymbol(symbol);
                }
                current = current[symbol.name];
                symbolStack.push(symbol), statusStack.push(current);
                if(!current)
                    throw new Error();
                return current.$div;
            };
        this.reset = function()
        {
            current = root;
            symbolStack = [];
            statusStack = [root];
        };
        Object.defineProperty(this, "grammarTree", 
        {   
            "get": function(){
                try
                {
                    while(current["$reduce"])
                    {
                        var count = current["$count"];
                        var newsymbol = new Symbol(current["$reduce"]);
                        while(count--)
                            newsymbol.childNodes.push(symbolStack.pop()), statusStack.pop();
                        current = statusStack[statusStack.length - 1];
                        this.insertSymbol(newsymbol);
                    }
                    if(symbolStack.length > 0 && current[";"])
                    {
                        this.insertSymbol(new Symbol(";", ";"));
                        return this.grammarTree;
                    }
                    if(symbolStack.length != 1 || symbolStack[0].name != "Program")
                        throw new Error();
                }catch(e)
                {
                    throw new SyntaxError("Unexpected end of input");
                }
                return symbolStack[0];
            }
            
        });
    }
    window.SyntacticalParser = SyntacticalParser;
    window.SyntacticalParser.Symbol = Symbol;
}();