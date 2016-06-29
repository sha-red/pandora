
def get_operator(op, type='str'):
    return {
        'str': {
            '==': '',
            '===': '',
            '>': '__gt',
            '>=': '__gte',
            '<': '__lt',
            '<=': '__lte',
            '^': '__startswith',
            '$': '__endswith',
        },
        'istr': {
            '==': '__iexact',
            '===': '',
            '>': '__gt',
            '>=': '__gte',
            '<': '__lt',
            '<=': '__lte',
            '^': '__istartswith',
            '$': '__iendswith',
        },
        'int': {
            '==': '',
            '>': '__gt',
            '>=': '__gte',
            '<': '__lt',
            '<=': '__lte',
        }
    }[type].get(op, {
        'str': '__contains',
        'istr': '__icontains',
        'int': ''
    }[type])

