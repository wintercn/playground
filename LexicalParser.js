var lex = 
{
    InputElement:"<WhiteSpace>|<LineTerminator>|<Comment>|<Keyword>|<Identifier>|<NumericLiteral>|<Punctuator>", 
    WhiteSpace:/[\t\v\f\u0020\u00A0\u1680\u180E\u2000-\u200A\u202F\u205f\u3000\uFEFF]/, 
    LineTerminator:/[\n\r\u2028\u2029]/, 
    Comment:"<SingleLineComment>|<MultiLineComment>", 
    SingleLineComment:/\/\/[^\n\r\u2028\u2029]*/, 
    MultiLineComment:/\/\*(?:[^*]|\*[^\/])*\*?\*\//, 
    Keyword:/const(?![_$a-zA-Z0-9])/,
    Identifier:/[_$a-zA-Z][_$a-zA-Z0-9]*/, 
    Punctuator:/=>|=|\(|\)|;/, 
    NumericLiteral:/(?:0[xX][0-9a-fA-F]*|\.[0-9]+|(?:[1-9]+[0-9]*|0)(?:\.[0-9]*|\.)?)(?:[eE][+-]{0,1}[0-9]+)?(?![_$a-zA-Z0-9])/, 
};
function XRegExp(xregexps, rootname, flag)
{
    var expnames = [rootname];
    function buildRegExp(source)
    {
        var regexp = new RegExp(source.replace(/<([^>]+)>/g, 
            function(all, expname)
            {
                if(!xregexps[expname])
                    return "";
                expnames.push(expname);
                if(xregexps[expname]instanceof RegExp)
                    return "(" + xregexps[expname].source + ")";
                return "(" + buildRegExp(xregexps[expname]).source + ")";
            }), flag);
        return regexp;
    }
    var regexp = buildRegExp(xregexps[rootname]);
    this.exec = 
        function(string)
        {
            var matches = regexp.exec(string);
            if(matches == null)
                return null;
            var result = new String(matches[0]);
            for(var i = 0;i < expnames.length;i++)
                if(matches[i])
                    result[expnames[i]] = matches[i];
            return result;
        };
    Object.defineProperty(this, "lastIndex", 
    {
        "get":
        function()
        {
            return regexp.lastIndex;
        }, "set":
        function(v)
        {
            regexp.lastIndex = v;
        }
        
    });
}
function* parseLex(source)
{
    let inputElement = new XRegExp(lex, "InputElement", "g");
    let lastIndex = 0
    while(true) {
        let token = inputElement.exec(source);
        if(!token)
            return null;
        if(token && inputElement.lastIndex - lastIndex > token.length)
        {
            throw new SyntaxError("Unexpected token ILLEGAL");
        }
        lastIndex = inputElement.lastIndex;
        yield token;
    }
}